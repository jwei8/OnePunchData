/**
 * Load data from CSV file
 */
let data, scatterPlot;

const dispatcher = d3.dispatch('mainToScatterGenreSelect', 'mainToDrillDown');

let topLevelBubble, animeLevelBubble;

let genreToInfo = {
  "Action": { color: "#fd7f6f", chargeModifier: -10 },
  "Comedy": { color: "#7eb0d5", chargeModifier: -22 }, //-18
  "Sci-Fi": { color: "#b2e061", chargeModifier: -130 }, //45
  "Adventure": { color: "#bd7ebe", chargeModifier: -60 }, //25
  "Music": { color: "#ffb55a", chargeModifier: -200 }, //45
  "Game": { color: "#beb9db", chargeModifier: -325 }, //55
  "Mystery": { color: "#fdcce5", chargeModifier: -90 }, //25
  "Harem": { color: "#8bd3c7", chargeModifier: -600 }, //60
  "Drama": { color: "#bbd2de", chargeModifier: -60 }, //27
  "Slice of Life": { color: "#ffee65", chargeModifier: -36 }, //22
}


d3.csv('data/anime_processed.csv')
  .then(_data => {
    data = _data

    const globalMinScore = d3.min(data, d => d.Score);
    const globalMaxScore = d3.max(data, d => d.Score);

    topLevelBubble = new TopPackedBubbleChart({
      parentElement: '#packed-bubble',
      parentElementLegend: '#packed-bubble-legend'
    }, data, genreToInfo, dispatcher);

    animeLevelBubble = new AnimePackedBubbleChart({
      parentElement: '#packed-bubble',
      parentElementLegend: '#packed-bubble-legend'
    }, genreToInfo, globalMinScore, globalMaxScore);

    data.forEach(d => {
      // Extract the year from the "Premiered" column and convert to number
      d.YearReleased = parseInt(d.Premiered.match(/\d+/)[0]);
    });

    barchart = new Barchart({ parentElement: '#bar-chart' }, data);
    barchart.updateVis();

    data.forEach(d => {
      // console.log(_data)
      d.Completed = +d.Completed;
      d.Dropped = +d.Dropped;
      d.Scored = +d.Score;
      d.CompletedDroppedRatio = d.Dropped !== 0 ? d.Completed / d.Dropped : d.Completed; // Prevent division by zero
      d.PrimaryGenre = d.Genre.split(",")[0];
    });

    scatterPlot = new ScatterPlot({ parentElement: '#scatter-plot' }, data);
    scatterPlot.updateVis();

  })
  .catch(error => console.error(error));

dispatcher.on('mainToScatterGenreSelect', (genreName) => {
    console.log(genreName)
    scatterPlot.updateChart(genreName);
});

dispatcher.on('mainToDrillDown', (genreName, animes, rerenderLegend) => {
  if (genreName !== null) {
    animeLevelBubble.updateVis(genreName, animes, rerenderLegend);
  }
});