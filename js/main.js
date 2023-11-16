/**
 * Load data from CSV file
 */

d3.csv('data/anime_processed.csv')
  .then(data => {

    const globalMinScore = d3.min(data, d => d.Score);

    console.log(globalMinScore);

    const groupedAnimes = d3.groups(data, d => d.Genre);

        const groupedAnimesObjects = groupedAnimes.map(([genre, animes]) => {
            return {genre: genre, count: animes.length, animes: animes};
        });

        const root = d3.hierarchy({ children: groupedAnimesObjects })
            .sum(d => d.count);

        console.log(root.children[0].data.animes)

    topLevelBubble = new TopPackedBubbleChart({
      parentElement: '#packed-bubble'
    }, data);

    animeLevelBubble = new AnimePackedBubbleChart({
      parentElement: '#packed-bubble'
    });

    animeLevelBubble.updateVis("Action", root.children[0].data.animes);
  

  })
  .catch(error => console.error(error));

