/**
 * Load data from CSV file
 */
let data, scatterPlot;

const dispatcher = d3.dispatch('mainToScatterGenreSelect',
                                'mainToDrillDown',
                                'selectAnimeOnClick',
                                'selectGenreOnClickScatter',
                                'selectAnimeOnClickScatter',
                                'notClickableGlobal',
                                'clearSelectedGenre',
                                'clearSelectedAnimes');

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

function resizeContent() {
  var scaleFactor = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  var container = document.getElementById('container');
  container.style.transform = `scale(${scaleFactor * 1.3})`;
  container.style.transformOrigin = 'top center';
}

window.addEventListener('resize', resizeContent);
window.addEventListener('load', resizeContent);

d3.csv('data/anime_processed.csv')
  .then(_data => {
    data = _data

    const globalMinScore = d3.min(data, d => d.Score);
    const globalMaxScore = d3.max(data, d => d.Score);

    topLevelBubble = new TopPackedBubbleChart({
      parentElement: '#packed-bubble',
    }, data, genreToInfo, dispatcher);

    animeLevelBubble = new AnimePackedBubbleChart({
      parentElement: '#packed-bubble',
    }, genreToInfo, globalMinScore, globalMaxScore, dispatcher);

    data.forEach(d => {
      // Extract the year from the "Premiered" column and convert to number
      d.YearReleased = parseInt(d.Premiered.match(/\d+/)[0]);
    });

    barchart = new Barchart({ 
      parentElement: '#bar-chart',
      parentTitleElement: '#bar-chart-title',
    }, data, genreToInfo);

    barchart.updateVis();

    data.forEach(d => {
      // console.log(_data)
      d.Completed = +d.Completed;
      d.Dropped = +d.Dropped;
      d.Scored = +d.Score;
      d.CompletedDroppedRatio = d.Dropped !== 0 ? d.Completed / d.Dropped : d.Completed; // Prevent division by zero
    });

    scatterPlot = new ScatterPlot({ 
      parentElement: '#scatter-plot',
      parentTitleElement: '#scatter-title',
    }, data, genreToInfo, dispatcher);
    scatterPlot.updateVis();

  })
  .catch(error => console.error(error));

dispatcher.on('mainToScatterGenreSelect', (genreName) => {
    scatterPlot.updateChart(genreName);
    scatterPlot.updateLegendColors();
    barchart.updateChart(genreName);
});

dispatcher.on('mainToDrillDown', (genreName, animes) => {
  if (genreName !== null) {
    animeLevelBubble.updateVis(genreName, animes);
    scatterPlot.updateLegendColors();
  }
});

dispatcher.on('selectAnimeOnClick', (selectedAnimes) => {
  animeLevelBubble.selectedAnimes.concat(selectedAnimes);
  scatterPlot.updateChartByAnime(selectedAnimes);
});

dispatcher.on('selectAnimeOnClickScatter', (selectedAnimes) => {
  animeLevelBubble.selectedAnimes.concat(selectedAnimes);
  animeLevelBubble.updateChartByAnime(selectedAnimes);
});

dispatcher.on('selectGenreOnClickScatter', (selectedGenre) => {
  topLevelBubble.selectedGenre = selectedGenre;
  topLevelBubble.selectGenre(selectedGenre);
});

dispatcher.on('notClickableGlobal', (notClickableGlobal) => {
  scatterPlot.notClickableGlobal = notClickableGlobal;
})

dispatcher.on('clearSelectedGenre', () => {
  topLevelBubble.selectedGenre = null;
  scatterPlot.selectGenre = null;
  scatterPlot.updateLegendColors();
  topLevelBubble.zoomOut();
})

dispatcher.on('clearSelectedAnimes', (selectedAnimes) => {
  animeLevelBubble.selectedAnimes = selectedAnimes;
  scatterPlot.selectedAnimes = selectedAnimes;
  scatterPlot.updateChartByAnime(selectedAnimes);
});