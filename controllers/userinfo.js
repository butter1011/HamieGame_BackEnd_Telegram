const { UserProfile, GameSession } = require("../models/User");
const cron = require('node-cron');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});


// Daily reset at midnight UTC
cron.schedule('0 0 * * *', async () => {
  try {
    await UserProfile.updateMany(
      {},
      { $set: { dailyBestScore: 0 } }
    );
    logger.info('Daily scores reset successfully');
  } catch (error) {
    logger.error('Error resetting daily scores:', { error });
  }
});

// Weekly reset at midnight UTC on Sunday
cron.schedule('0 0 * * 0', async () => {
  try {
    // Get all users
    const users = await UserProfile.find({});

    for (const user of users) {
      // Count sessions for this user
      const sessionCount = await GameSession.countDocuments({ user: user._id });

      if (sessionCount > 1) {
        // If user has more than 1 session, reset to 0
        await UserProfile.updateOne(
          { _id: user._id },
          {
            $set: {
              weeklyBestScore: 0,
              weeklyBestScores: [0, 0, 0]
            }
          }
        );
      } else {
        // If user has 0 or 1 session, set to random values between 0-30
        const randomScores = [
          Math.floor(Math.random() * 31),
          Math.floor(Math.random() * 31),
          Math.floor(Math.random() * 31)
        ];

        await UserProfile.updateOne(
          { _id: user._id },
          {
            $set: {
              weeklyBestScore: randomScores[0], // Set the main score to the first random value
              weeklyBestScores: randomScores
            }
          }
        );
      }
    }

    logger.info('Weekly scores reset successfully with session-based logic');
  } catch (error) {
    logger.error('Error resetting weekly scores:', { error });
  }
});





// UserFindSave if not user, create it
exports.userFindSave = async (req, res) => {
  logger.info('userFindSave IN', { body: req.body });
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

      logger.info('userFindSave OUT', { newUser, currentTime });
      res.status(200).json({
        newUser,
        currentTime,
      });
    } else if (user) {
      // Get the rank for bestscore
      const bestScoreRank = await UserProfile.countDocuments({ bestScore: { $gt: user.bestScore } }) + 1;

      logger.info('userFindSave OUT', { user, bestScoreRank });
      res.status(201).json({
        user,
        bestScoreRank,
      });
    } else {
      logger.warn('userFindSave OUT: Invalid user data', { userData });
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    logger.error('userFindSave ERROR', { error });
    res.status(401).json(error);
  }
};

// UserData Save
exports.userDataSave = async (req, res) => {
  logger.info('userDataSave IN', { body: req.body });
  try {
    const data = req.body.data;
    const userData = JSON.parse(data);
    const telegramId = userData.telegramId;
    const score = userData.score;
    const coins = userData.coins; // New: coins field

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
        user.weeklyBestScores = [0, 0, 0];
      }

      // Update scores
      if (user.bestScore < score) {
        user.bestScore = score;
      }
      if (user.weeklyBestScore < score) {
        user.weeklyBestScore = score;
      }

      if (!Array.isArray(user.weeklyBestScores) || user.weeklyBestScores.length < 3) {
        user.weeklyBestScores = [0, 0, 0];
      }

      // Find minimum value in weeklyBestScores
      const minWeeklyScore = Math.min(...user.weeklyBestScores);

      // If the new score is greater than the minimum weekly score, replace the minimum
      if (score > minWeeklyScore) {
        const minIndex = user.weeklyBestScores.indexOf(minWeeklyScore);
        user.weeklyBestScores[minIndex] = score;
        user.weeklyBestScores.sort((a, b) => b - a); // Re-sort
      }

      // Update totalCoins if coins are provided
      if (typeof coins === 'number' && !isNaN(coins)) {
        user.totalCoins = (user.totalCoins || 0) + coins;
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
      logger.info('userDataSave OUT', { telegramId, score, coins });
    }
    res.status(200).json("Updated Successfully");
  } catch (error) {
    logger.error('userDataSave ERROR', { error });
    res.status(401).json(error);
  }
};

// Get daily leaderboard and sessions
exports.getDailyData = async (req, res) => {
  logger.info('getDailyData IN', { body: req.body });
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const userlist = await UserProfile.aggregate([
      {
        $lookup: {
          from: 'gamesessions',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                startTime: { $gte: today } // Filter sessions by date within the lookup
              }
            },
            { $limit: 1 } // Limit to 1 to check for existence
          ],
          as: 'sessionCheck'
        }
      },
      {
        $match: {
          'sessionCheck.0': { $exists: true } // Filter users who have sessions today
        }
      },
      {
        $project: {
          sessionCheck: 0 // Remove the sessionCheck field from output
        }
      },
      {
        $sort: { dailyBestScore: -1 } // Sort by dailyBestScore
      }
    ]);

    const averageDailyScore = userlist.length > 0 ? userlist.reduce((sum, user) => sum + user.dailyBestScore, 0) / userlist.length : 0;

    // Now that we have userlist filtered, get the sessions for those users
    const userIds = userlist.map(user => user._id);
    const sessions = await GameSession.find({
      user: { $in: userIds },
      startTime: { $gte: today }
    })
      .populate('user', 'username firstName lastName')
      .sort({ score: -1 });

    const currentTime = new Date().toUTCString();

    logger.info('getDailyData OUT', { userlistCount: userlist.length, sessionCount: sessions.length, currentTime });
    res.status(200).json({
      userlist,
      sessions,
      currentTime,
      averageScore: Math.round(averageDailyScore * 10) / 10,
    });
  } catch (error) {
    logger.error('getDailyData ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};



// Get weekly leaderboard and sessions
exports.getWeeklyData = async (req, res) => {
  logger.info('getWeeklyData IN', { body: req.body });
  try {
    const currentDate = new Date();
    const lastSunday = new Date(currentDate);
    lastSunday.setUTCHours(0, 0, 0, 0);
    const daysSinceSunday = lastSunday.getUTCDay();
    lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);

    const userlistRaw = await UserProfile.aggregate([
      {
        $lookup: {
          from: 'gamesessions',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] },
                startTime: { $gte: lastSunday }
              }
            },
            { $limit: 1 }
          ],
          as: 'sessionCheck'
        }
      },
      {
        $match: {
          'sessionCheck.0': { $exists: true }
        }
      },
      {
        $project: {
          sessionCheck: 0,
          username: 1,
          firstName: 1,
          lastName: 1,
          telegramId: 1,
          score: '$weeklyBestScore'
        }
      },
      {
        $sort: { score: -1 }
      }
    ]);

    const userlist = userlistRaw.map(u => ({
      ...u,
      score: u.score
    }));

    const averageWeeklyScore = userlist.length > 0 ? userlist.reduce((sum, user) => sum + user.score, 0) / userlist.length : 0;
    const userIds = userlist.map(user => user._id);
    const sessions = await GameSession.find({
      user: { $in: userIds },
      startTime: { $gte: lastSunday }
    })
      .populate('user', 'username firstName lastName')
      .sort({ score: -1 });
    const currentTime = new Date().toUTCString();
    logger.info('getWeeklyData OUT', { userlistCount: userlist.length, sessionCount: sessions.length, currentTime });
    res.status(200).json({
      userlist,
      sessions,
      averageScore: Math.round(averageWeeklyScore * 10) / 10,
      currentTime,
    });
  } catch (error) {
    logger.error('getWeeklyData ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};




exports.getWeeklyDataForLeard = async (req, res) => {
  logger.info('getWeeklyDataForLeard IN', { body: req.body });
  try {
    const currentDate = new Date();
    const lastSunday = new Date(currentDate);
    lastSunday.setUTCHours(0, 0, 0, 0);
    const daysSinceSunday = lastSunday.getUTCDay();
    lastSunday.setUTCDate(lastSunday.getUTCDate() - daysSinceSunday);

    // Get all users, sorted by weeklyBestScore, limited to 100
    const users = await UserProfile.find().sort({ weeklyBestScore: -1 }).limit(100);

    // Only return a single unified score per user
    const userlist = users.map(user => ({
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      telegramId: user.telegramId,
      score: user.weeklyBestScore
    }));

    // The top user for the crown (first in the sorted list)
    const bestUser = userlist.length > 0 ? userlist[0] : null;
    const currentTime = new Date().toUTCString();
    logger.info('getWeeklyDataForLeard OUT', { userlistCount: userlist.length, bestUser, currentTime });
    res.status(200).json({
      userlist,
      bestUser,
      currentTime
    });
  } catch (error) {
    logger.error('getWeeklyDataForLeard ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};









exports.getTotalData = async (req, res) => {
  logger.info('getTotalData IN', { body: req.body });
  try {
    const userlistRaw = await UserProfile.aggregate([
      {
        $lookup: {
          from: 'gamesessions',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$user', '$$userId'] }
              }
            },
            { $limit: 1 }
          ],
          as: 'sessionCheck'
        }
      },
      {
        $match: {
          'sessionCheck.0': { $exists: true }
        }
      },
      {
        $project: {
          sessionCheck: 0,
          username: 1,
          firstName: 1,
          lastName: 1,
          telegramId: 1,
          score: '$bestScore'
        }
      },
      {
        $sort: { score: -1 }
      }
    ]);
    const userlist = userlistRaw.map(u => ({
      ...u,
      score: u.score
    }));
    const sessions = await GameSession.find()
      .populate('user', 'username firstName lastName')
      .sort({ score: -1 });
    const averageBestScore = userlist.reduce((sum, user) => sum + user.score, 0) / userlist.length;
    const currentTime = new Date().toUTCString();
    logger.info('getTotalData OUT', { userlistCount: userlist.length, sessionCount: sessions.length, currentTime });
    res.status(200).json({
      userlist,
      sessions,
      averageScore: Math.round(averageBestScore * 10) / 10,
      currentTime
    });
  } catch (error) {
    logger.error('getTotalData ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};





// Get users sorted by their session counts
exports.getUsersBySessionCount = async (req, res) => {
  logger.info('getUsersBySessionCount IN', { body: req.body });
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

    logger.info('getUsersBySessionCount OUT', { userCount: usersWithSessionCounts.length, currentTime });
    res.status(200).json({
      users: usersWithSessionCounts,
      currentTime
    });
  } catch (error) {
    logger.error('getUsersBySessionCount ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};

// Get session statistics for specific time periods
exports.getSessionStats = async (req, res) => {
  logger.info('getSessionStats IN', { body: req.body });
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

    // Get total session stats (all-time)
    const totalStats = await GameSession.aggregate([
      {
        $group: {
          _id: '$user',
          sessionCount: { $sum: 1 },
          highestScore: { $max: '$score' }
        }
      },
      { $sort: { sessionCount: -1 } },

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

    logger.info('getSessionStats OUT', { currentTime });
    res.status(200).json({
      dailyStats,
      weeklyStats,
      totalStats,
      currentTime
    });
  } catch (error) {
    logger.error('getSessionStats ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};


exports.getUserMetrics = async (req, res) => {
  logger.info('getUserMetrics IN', { body: req.body });
  try {

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

    logger.info('getUserMetrics OUT', { metrics: { totalUsers, weeklyActiveUsers, dailyActiveUsers }, currentTime });
    res.status(200).json({
      metrics: {
        totalUsers,
        weeklyActiveUsers,
        dailyActiveUsers
      },
      currentTime
    });
  } catch (error) {
    logger.error('getUserMetrics ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};


exports.getFrequentUsers = async (req, res) => {
  try {
    const frequentUsers = await GameSession.aggregate([
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' }
        }
      },
      {
        $lookup: {
          from: 'userprofiles',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          username: '$userDetails.username',
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          totalScore: 1
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 10 }
    ]);



    res.status(200).json({
      frequentUsers,

    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get total coins leaderboard
exports.getTotalCoinsLeaderboard = async (req, res) => {
  logger.info('getTotalCoinsLeaderboard IN', { body: req.body });
  try {
    const userlistRaw = await UserProfile.find()
      .sort({ totalCoins: -1 })
      .limit(100)
      .select('username firstName lastName telegramId totalCoins');
    const userlist = userlistRaw.map(u => ({
      _id: u._id,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      telegramId: u.telegramId,
      score: u.totalCoins
    }));
    const currentTime = new Date().toUTCString();
    logger.info('getTotalCoinsLeaderboard OUT', { userlistCount: userlist.length, currentTime });
    res.status(200).json({
      userlist,
      currentTime
    });
  } catch (error) {
    logger.error('getTotalCoinsLeaderboard ERROR', { error });
    res.status(500).json({ error: error.message });
  }
};

