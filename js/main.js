/**
 * Load data from CSV file
 */ 

const dispatcher = d3.dispatch('topToDrillDown')

let topLevelBubble, animeLevelBubble;

let genreToInfo = {
  "Action" : {color: "#fd7f6f", chargeModifier: -10},
  "Comedy" : {color: "#7eb0d5", chargeModifier: -22}, //-18
  "Sci-Fi" : {color: "#b2e061", chargeModifier: -130}, //45
  "Adventure" : {color: "#bd7ebe", chargeModifier: -60}, //25
  "Music" : {color: "#ffb55a", chargeModifier: -200}, //45
  "Game" : {color:  "#beb9db", chargeModifier: -325}, //55
  "Mystery" : {color:  "#fdcce5", chargeModifier: -90}, //25
  "Harem" : {color: "#8bd3c7", chargeModifier: -600}, //60
  "Drama" : {color: "#bbd2de", chargeModifier: -60}, //27
  "Slice of Life" : {color:  "#ffee65", chargeModifier: -36}, //22
}


d3.csv('data/anime_processed.csv')
  .then(data => {

    const globalMinScore = d3.min(data, d => d.Score);
    const globalMaxScore = d3.max(data, d => d.Score);

    topLevelBubble = new TopPackedBubbleChart({
      parentElement: '#packed-bubble'
    }, data, genreToInfo, dispatcher);

    animeLevelBubble = new AnimePackedBubbleChart({
      parentElement: '#packed-bubble'
    }, genreToInfo, globalMinScore, globalMaxScore);
  })
  .catch(error => console.error(error));

  dispatcher.on('topToDrillDown', (genreName, animes) => {
    animeLevelBubble.updateVis(genreName, animes);
  })

