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
    const username = userData.username;
    
    const user = await UserProfile.findOne({ telegramId: telegramId });
    const currentTime = new Date().toUTCString();

    if (!user) {
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
    } else {
      res.status(200).json({
        user,
        currentTime,
      });
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
