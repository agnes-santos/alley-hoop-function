const functions = require("firebase-functions");
const axios = require("axios");
const { db, runtimeOpts } = require("./util/db");

exports.updateGamesToday = functions
  .runWith(runtimeOpts)
  .pubsub //Every minute, every hour between 6am-1pm
  .schedule("* 6-14 * * *")
  .timeZone("Asia/Singapore")
  .onRun((context) => {
    const todayScoreboardApi = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';

    return (
      axios
        .get(todayScoreboardApi)
        // Filters only needed games data
        .then((res) => {
          const responseGames = res.data.scoreboard.games;
          
          const games = responseGames.map(game => {
            const { awayTeam, homeTeam } = game;
            
            const gameDetails = {
              id: game.gameId,
              timeUTC: game.gameTimeUTC,
              status: game.gameStatus,
              statusText: game.gameStatusText,
              homeTeam: {
                score: homeTeam.score,
                triCode: homeTeam.teamTricode
              },
              awayTeam: {
                score: awayTeam.score,
                triCode: awayTeam.teamTricode
              }
            };

            return gameDetails;
          });

          return games;

        })
        // Updates filtered gamesToday in the Realtime Database
        .then((gamesToday) => {
          return db.ref().update({ gamesToday });
        })
    );
  });
