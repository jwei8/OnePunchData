/**
 * Load data from CSV file
 */ 

const dispatcher = d3.dispatch('topToDrillDown')

let topLevelBubble, animeLevelBubble;

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
    }, data, dispatcher);

    animeLevelBubble = new AnimePackedBubbleChart({
      parentElement: '#packed-bubble'
    });
  })
  .catch(error => console.error(error));

  dispatcher.on('topToDrillDown', (genreName, animes) => {
    animeLevelBubble.updateVis(genreName, animes);
  })

