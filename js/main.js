/**
 * Load data from CSV file
 */


d3.csv('data/anime_processed.csv')
  .then(_data => {
    data = _data
    data.forEach(d => {
      // Extract the year from the "Premiered" column and convert to number
      d.YearReleased = parseInt(d.Premiered.match(/\d+/)[0]);
    });

    barchart = new Barchart({ parentElement: '#bar-chart' }, data);
    barchart.updateVis();

  })
  .catch(error => console.error(error));
