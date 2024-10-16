const { UserProfile, GameSession } = require("../models/User");

// UserFindSave if not user, create it
exports.userFindSave = async (req, res) => {
  try {
    // Get user information from the request body 
    const data = req.body.data;
    const userData = JSON.parse(data);

    const telegramId = userData.telegramId;
    const firstName = userData.firstName;
    const lastName = userData.lastName;
    const username = userData.userName;
    const phoneNumber = userData.phoneNumber; // Add this line to get the phone number

    const user = await UserProfile.findOne({ telegramId: telegramId });
    const currentTime = new Date().toUTCString();

    if (!user && telegramId != 0) {
      // Create new user
      const newUser = new UserProfile({
        telegramId: telegramId,
        username: username,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber, // Add this line to save the phone number
      });

      await newUser.save(); // Save the new user

      res.status(200).json({
        newUser,
        currentTime,
      });
    } else if (user) {
      // Update existing user's phone number if it's provided
      if (phoneNumber) {
        user.phoneNumber = phoneNumber;
        await user.save();
      }

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
    const data = req.body.data;
    const userData = JSON.parse(data);
    const telegramId = userData.telegramId;
    const score = userData.score;
    
    const user = await UserProfile.findOne({ telegramId: telegramId });
    if (user) {
      if(user.bestScore < score){
        user.bestScore = score;
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
    // Get user information from the request body 
    const currentTime = new Date().toUTCString();
    const userlist = await UserProfile.find().sort({ bestScore: -1 }).limit(100);
    res.status(201).json({
      userlist,
      currentTime
    }); 
    console.log(userlist);
    
  } catch (error) {
    res.status(401).json(error);
  }
};