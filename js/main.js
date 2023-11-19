/**
 * Load data from CSV file
 */
let data, scatterPlot;
d3.csv('data/anime_processed.csv')
    .then(_data => {
      data = _data;
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
