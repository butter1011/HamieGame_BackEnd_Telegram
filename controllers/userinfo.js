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
      const currentDate = new Date();
      const today = new Date(currentDate);
      today.setUTCHours(0, 0, 0, 0);
      
      const lastSunday = new Date(currentDate);
    
      lastSunday.setUTCHours(0, 0, 0, 0);
      const daysSinceSunday = lastSunday.getUTCDay();
      
      lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);


      // Reset scores if needed
      if (user.updatedAt < today) {
        user.dailyBestScore = 0;
      }
      if (user.updatedAt < lastSunday) {
        user.weeklyBestScore = 0;
      }

      // Update scores
      if (user.bestScore < score) {
        user.bestScore = score;
      }
      if (user.dailyBestScore < score) {
        user.dailyBestScore = score;
      }
      if (user.weeklyBestScore < score) {
        user.weeklyBestScore = score;
      }

      // Create new game session
      const newGameSession = new GameSession({
        user: user._id,
        score: score,
        startTime: new Date(),
        endTime: new Date()
      });

      await newGameSession.save();
      await user.save();
    }
    res.status(200).json("Updated Successfully");
  } catch (error) {
    res.status(401).json(error);
  }
};

// Get daily leaderboard and sessions
exports.getDailyData = async (req, res) => {

  try {
    console.log("getUserMetrics💖🐱‍🐉");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Get top 100 users for daily scores
    const userlist = await UserProfile.find({
      updatedAt: { $gte: today }
    })
    .sort({ dailyBestScore: -1 })
    .limit(100);

    // Get top 100 sessions for today
    const sessions = await GameSession.find({
      startTime: { $gte: today }
    })
    .populate('user', 'username firstName lastName')
    .sort({ score: -1 })
    .limit(100);

    const currentTime = new Date().toUTCString();

    res.status(200).json({
      userlist,
      sessions,
      currentTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get weekly leaderboard and sessions
exports.getWeeklyData = async (req, res) => {

  try {
    console.log("getUserMetrics💖🤞");
    const currentDate = new Date();
    const lastSunday = new Date(currentDate);
    
    lastSunday.setUTCHours(0, 0, 0, 0);
    
    const daysSinceSunday = lastSunday.getUTCDay();
    lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);

    // Get top 100 users for weekly scores
    const userlist = await UserProfile.find({
      updatedAt: { $gte: lastSunday }
    })
    .sort({ weeklyBestScore: -1 })
    .limit(100);

    // Get top 100 sessions for the week
    const sessions = await GameSession.find({
      startTime: { $gte: lastSunday }
    })
    .populate('user', 'username firstName lastName')
    .sort({ score: -1 })
    .limit(100);

    const currentTime = new Date().toUTCString();

    res.status(200).json({
      userlist,
      sessions,
      currentTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all-time leaderboard and sessions
exports.getTotalData = async (req, res) => {

  try {
    console.log("getUserMetrics💖😎");
    // Get top 100 users all-time
    const userlist = await UserProfile.find()
      .sort({ bestScore: -1 })
      .limit(100);

    // Get top 100 sessions all-time
    const sessions = await GameSession.find()
      .populate('user', 'username firstName lastName')
      .sort({ score: -1 })
      .limit(100);

    const currentTime = new Date().toUTCString();
    // console.log(userlist);
    res.status(200).json({
      userlist,
      sessions,
      currentTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get users sorted by their session counts
exports.getUsersBySessionCount = async (req, res) => {
  try {
    // Aggregate pipeline to count sessions for each user
    const usersWithSessionCounts = await GameSession.aggregate([
      // Group by user and count their sessions
      {
        $group: {
          _id: '$user',
          sessionCount: { $sum: 1 },
          totalScore: { $sum: '$score' },
          averageScore: { $avg: '$score' }
        }
      },
      // Lookup user details
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      // Unwind the userDetails array
      { $unwind: '$userDetails' },
      // Shape the output
      {
        $project: {
          username: '$userDetails.username',
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          telegramId: '$userDetails.telegramId',
          bestScore: '$userDetails.bestScore',
          sessionCount: 1,
          totalScore: 1,
          averageScore: { $round: ['$averageScore', 2] }
        }
      },
      // Sort by session count (descending)
      { $sort: { sessionCount: -1 } },
      // Limit to top 100 users
      { $limit: 100 }
    ]);

    const currentTime = new Date().toUTCString();

    res.status(200).json({
      users: usersWithSessionCounts,
      currentTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get session statistics for specific time periods
exports.getSessionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const lastSunday = new Date();
    lastSunday.setUTCHours(0, 0, 0, 0);
    const daysSinceSunday = lastSunday.getUTCDay();
    lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);

    // Get daily session stats
    const dailyStats = await GameSession.aggregate([
      { $match: { startTime: { $gte: today } } },
      {
        $group: {
          _id: '$user',
          sessionCount: { $sum: 1 },
          highestScore: { $max: '$score' }
        }
      },
      { $sort: { sessionCount: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' }
    ]);

    // Get weekly session stats
    const weeklyStats = await GameSession.aggregate([
      { $match: { startTime: { $gte: lastSunday } } },
      {
        $group: {
          _id: '$user',
          sessionCount: { $sum: 1 },
          highestScore: { $max: '$score' }
        }
      },
      { $sort: { sessionCount: -1 } },
      { $limit: 100 },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' }
    ]);

    const currentTime = new Date().toUTCString();

    res.status(200).json({
      dailyStats,
      weeklyStats,
      currentTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserMetrics = async (req, res) => {
  try {
    console.log("getUserMetrics💖💖");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const lastSunday = new Date();
    lastSunday.setUTCHours(0, 0, 0, 0);
    const daysSinceSunday = lastSunday.getUTCDay();
    lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);

    // Get all counts in parallel for better performance
    const [totalUsers, weeklyActiveUsers, dailyActiveUsers] = await Promise.all([
      // Total registered users
      UserProfile.countDocuments(),
      
      // Weekly active users (users who played since last Sunday)
      UserProfile.countDocuments({
        updatedAt: { $gte: lastSunday }
      }),
      
      // Daily active users (users who played today)
      UserProfile.countDocuments({
        updatedAt: { $gte: today }
      })
    ]);

    const currentTime = new Date().toUTCString();

    res.status(200).json({
      metrics: {
        totalUsers,
        weeklyActiveUsers,
        dailyActiveUsers
      },
      currentTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};






// Add this new function to userinfo.js
