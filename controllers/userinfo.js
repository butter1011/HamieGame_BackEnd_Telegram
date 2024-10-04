const { UserProfile, GameSession } = require("../models/User");
// const ReferralInfo = require("../models/Inviter");

// UserFindSave if not user, create it
exports.userFindSave = async (req, res) => {
  try {
    // Get user information from the request body
    const telegramId = req.body.telegramId;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const username = req.body.username;
    
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

      // Create new Referral
      // const newReferral = new ReferralInfo({
      //   user_id: user_id,
      // });

      // await newReferral.save(); // Save the Referral

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
    const telegramId = req.body.telegramId;
    const score = req.body.score;
    
    // const userData = JSON.parse(data.data);

    const user = await UserProfile.findOne({ telegramId: telegramId });
    if (user) {
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

// Wallet Save
// exports.setWalletAddress = async (req, res) => {
//   try {
//     const data = req.body;
//     const wallet_address = data.data.wallet_address;
//     const wallet_name = data.data.wallet_name;
//     const user_id = data.data.user_id;
//     console.log("Wallet Address: ", wallet_address);
//     console.log("Wallet Name: ", wallet_name);
//     console.log("User ID: ", user_id);

//     const user = await ReferralInfo.findOne({ user_id: user_id });
//     if (user) {
//       user.walletAddress = wallet_address;
//       user.walletName = wallet_name;
//       response = await user.save();
//       console.log(response);
//       res.status(200).json("OK");
//     }

//     res.status(404).json("User not found");
//   } catch (error) {
//     res.status(401).json(error);
//   }
// };
