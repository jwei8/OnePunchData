class AnimePackedBubbleChart {

    constructor(_config, _genreToInfo, _globalMinScore, _globalMaxScore) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: 800,
          containerHeight: 800,
          legendWidth: 400,
          legendHeight: 400,
          tooltipPadding: 15,
          margin: {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40
          }
        }
        this.genreToInfo = _genreToInfo;
        this.globalMinScore = _globalMinScore;
        this.globalMaxScore = _globalMaxScore;
        this.ratingToColor = {
            "G - All Ages": "#ffffff",
            "PG - Children": "#ffff00",
            "PG-13 - Teens 13 or older": "#75147c",
            "R - 17+ (violence & profanity)": "#ff0000",
            "R+ - Mild Nudity": "#000000",
        }
        this.initVis();
      }

      initVis() {
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement);

        vis.pack = d3.pack()
            .size([vis.config.containerWidth, vis.config.containerWidth])
            .padding(15);
        
        vis.radiusScale = d3.scaleLinear().range([6,30]);
      }

      updateVis(genreToView, animeData) {
        let vis = this;

        //PERHAPS SCALE DATA BY GLOBAL MINIMUM rather than just the minimum in the genre

        vis.genre = genreToView;

        console.log(d3.min(animeData, d => d.Score));
        console.log(d3.max(animeData, d => d.Score));
        vis.anime = animeData.map(d => {
            return {
                ...d,
                Score: d.Score
            };
        });

        vis.root = d3.hierarchy({ children: vis.anime })
            .sum(d => d.Score);

        vis.nodes = vis.pack(vis.root).leaves();

        console.log(d3.min(vis.anime, d => d.Score));
        console.log(d3.max(vis.anime, d => d.Score));

        vis.radiusScale.domain([vis.globalMinScore, vis.globalMaxScore]);

        vis.renderVis();
      }

      renderVis() {
        let vis = this;

        vis.chartArea = vis.svg.append('g')
            .attr('class', 'anime-level-group')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        const chargeStrength = d => vis.genreToInfo[vis.genre].chargeModifier * vis.radiusScale(d.data.Score);

        const simulation = d3.forceSimulation(vis.nodes)
            .force("x", d3.forceX(vis.config.width / 2).strength(0.5))
            .force("y", d3.forceY(vis.config.width / 2).strength(0.5))
            .force('charge', d3.forceManyBody().strength(chargeStrength))
            .force("collision", d3.forceCollide().radius(d => vis.radiusScale(d.data.Score) + 4).strength(0.8));
        
        const animeGroups = vis.chartArea.selectAll('.anime-level-bubble-group')
                .data(vis.nodes, d => d.data.MAL_ID)
            .join('g')
                .attr('class', 'anime-level-bubble-group')
                .attr("transform", d => `translate(${d.x}, ${d.y})`);

        const bubbles = animeGroups.selectAll('.bubble-anime')
                .data(d => d, d => d.data.MAL_ID)
            .join('circle')
                .on('click', (event, d) => {
                    console.log(d.data)
                })
                .attr('class', 'bubble-anime')
                .attr('r', d => vis.radiusScale(d.data.Score))
                //.attr('stroke', '#000000')
               // .attr('stroke-width', 2)
                .attr('fill', d => vis.ratingToColor[d.data.Rating])
                .attr('opacity', 0);

        simulation.on("tick", () => {
            animeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        vis.renderLegend();

        bubbles.transition()
            .duration(500)
            .attr('opacity', 1);

      }


      renderLegend() {
        let vis = this;
        console.log(vis.radiusScale(9.19 - this.globalMinScore));
        
        const categories = [
          ["7.5", vis.radiusScale(7.5 - this.globalMinScore), vis.config.containerWidth + vis.config.legendWidth / 2, vis.config.legendHeight / 2],
          ["8.5", vis.radiusScale(8.5 - this.globalMinScore), vis.config.containerWidth + vis.config.legendWidth / 2, vis.config.legendHeight / 2],
          ["9.19", vis.radiusScale(9.19 - this.globalMinScore), vis.config.containerWidth + vis.config.legendWidth / 2, vis.config.legendHeight / 2]
      ].map(([name, r, x, y]) => ({ name, r, x, y }));

        vis.legendGroup = vis.svg.append('g')
            .attr('class', 'legend');
        
        const legendItems = vis.legendGroup.selectAll(".legend-item")
            .data(categories)
            .enter()
            .append('g')
            .attr('transform', d => `translate(${d.x},${d.y})`)
        
        // add legend text tittle
        vis.legendGroup.append('text')
        .style('font-size', 14)
        .attr('x', vis.config.containerWidth + vis.config.legendWidth / 2)
        .attr('text-anchor', 'middle')
        .attr('y', 20)
        .text("The Rating of the Anime");

        //adding circles
        legendItems.append('circle')
          .attr('fill', 'none')
          .attr('stroke', vis.genreToInfo[vis.genre].color)
          .attr('stroke-width', 2)
          .attr('r', d => d.r);
    
        // change the color for the selected text
        legendItems.select("text")
            .text(d => d.name);          
      }

}