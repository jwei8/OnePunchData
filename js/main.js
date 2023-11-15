/**
 * Load data from CSV file
 */

d3.csv('data/anime_processed.csv')
  .then(data => {

    topLevelBubble = new TopPackedBubbleChart({
      parentElement: '#packed-bubble'
    }, data);
  

  })
  .catch(error => console.error(error));

