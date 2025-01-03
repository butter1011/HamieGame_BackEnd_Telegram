const { UserProfile, GameSession } = require("../models/User");

// UserFindSave if not user, create it
exports.userFindSave = async (req, res) => {
  try {
    // Get user information from the request body 
    const data = req.body.data;
    const userData = JSON.parse(data);
    console.log("🚚🚑",req.body.data);
    const telegramId = userData.telegramId;
    const firstName = userData.firstName;
    const lastName = userData.lastName;
    const username = userData.userName;

    const user = await UserProfile.findOne({ telegramId: telegramId });
    const currentTime = new Date().toUTCString();

    if (!user && telegramId != 0) {
      // Create new user
      const newUser = new UserProfile({
        telegramId: telegramId,
        username: username,
        firstName: firstName,
        lastName: lastName,
      });

      await newUser.save(); // Save the new user

      res.status(200).json({
        newUser,
        currentTime,
      });
    } else if (user) {
      // Get the rank for bestscore
      const bestScoreRank = await UserProfile.countDocuments({ bestScore: { $gt: user.bestScore } }) + 1;
      console.log(bestScoreRank);
      res.status(201).json({
        user,
        bestScoreRank,
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    res.status(401).json(error);
  }
};

// UserData Save
exports.userDataSave = async (req, res) => {
  try {
    console.log("💚💛",req.body.data);
    const data = req.body.data;
    const userData = JSON.parse(data);
    const telegramId = userData.telegramId;
    const score = userData.score;
    
    const user = await UserProfile.findOne({ telegramId: telegramId });
    if (user) {

      const currentDate = new Date();
      const lastSunday = new Date(currentDate);
      lastSunday.setUTCHours(0, 0, 0, 0);
      
      // Calculate last Sunday
      const daysSinceSunday = lastSunday.getUTCDay();
      lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);
      
      // Check if user's last update was before last Sunday
      if (user.updatedAt < lastSunday) {
        user.weeklyBestScore = 0;
      }


      if(user.bestScore < score){
        user.bestScore = score;
      }
      if(user.weeklyBestScore < score){
        user.weeklyBestScore = score;
      }

      const currentTime = new Date().toUTCString();
      // Create a new GameSession
      const newGameSession = new GameSession({
        user: user._id,
        score: score,
        time: currentTime,
      });

      // Save the new GameSession
      await newGameSession.save();
      await user.save();
    }
    res.status(200).json("Updated Successfully");
  } catch (error) {
    res.status(401).json(error);
  }
};

exports.userList = async (req, res) => {
  try {
  
    
    // Get current date in UTC
    const currentDate = new Date();
    
    // Calculate the last Sunday (UTC)
    const lastSunday = new Date(currentDate);
    lastSunday.setUTCHours(0, 0, 0, 0); // Set time to midnight in UTC

    // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const daysSinceSunday = lastSunday.getUTCDay();

    // If today is Sunday, go back to the previous Sunday
    if (daysSinceSunday === 0) {
      lastSunday.setUTCDate(lastSunday.getUTCDate() - 7);
    }
    
    // Subtract the number of days since last Sunday to get to the most recent Sunday
    lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);

    // Retrieve users created since last Sunday
    const userlist = await UserProfile.find({
      updatedAt: { $gte: lastSunday }
    }).sort({ bestScore: -1 }).limit(100);

    // Retrieve the item with the best score from all items in the database
    const bestItem = await UserProfile.findOne().sort({ bestScore: -1 });

    const currentTime = new Date().toUTCString();

    res.status(200).json({
      userlist,
      bestItem,
      currentTime
    });


    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

