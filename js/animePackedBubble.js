class AnimePackedBubbleChart {

    constructor(_config) {
        this.config = {
          parentElement: _config.parentElement,
          containerWidth: 800,
          containerHeight: 800,
          tooltipPadding: 15,
          margin: {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40
          }
        }
        this.initVis();
      }

      initVis() {
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement);

        vis.chartArea = vis.svg.append('g')
            .attr('class', 'anime-level-group')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        vis.chartArea.append('circle')
            .attr('r', vis.config.width / 2)
            .attr('fill', '#ADD8E6')
            //.attr('fill', 'none')
            .attr('cx', vis.config.width / 2)
            .attr('cy', vis.config.width / 2)
            .attr('opacity', 0.5);

        vis.pack = d3.pack()
            .size([vis.config.containerWidth, vis.config.containerWidth])
            .padding(15);
      }

      updateVis(genreToView, animeData) {
        let vis = this;

        //PERHAPS SCALE DATA BY GLOBAL MINIMUM rather than just the minimum in the genre

        vis.genre = genreToView;

        vis.minScore = d3.min(animeData, d => d.Score);

        console.log(vis.minScore)

        vis.anime = animeData.map(d => {
            return {
                ...d,
                Score: d.Score - vis.minScore + 0.05
            };
        });

        vis.root = d3.hierarchy({ children: vis.anime })
            .sum(d => d.Score);

        vis.nodes = vis.pack(vis.root).leaves();

        console.log(vis.nodes)

        vis.renderVis();
      }

      renderVis() {
        let vis = this;

        const chargeStrength = d => -10 * d.r;

        const simulation = d3.forceSimulation(vis.nodes)
            .force("x", d3.forceX(vis.config.width / 2).strength(0.5))
            .force("y", d3.forceY(vis.config.width / 2).strength(0.5))
            .force('charge', d3.forceManyBody().strength(chargeStrength))
            .force("collision", d3.forceCollide().radius(d => d.r + 4).strength(0.8));
        
        const animeGroups = vis.chartArea.selectAll('.anime-level-bubble-group')
                .data(vis.nodes, d => d.data.MAL_ID)
            .join('g')
                .attr('class', 'anime-level-bubble-group')
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                .attr('opacity', 0.8);

        const bubbles = animeGroups.selectAll('.bubble-anime')
                .data(d => d, d => d.data.MAL_ID)
            .join('circle')
                .attr('class', 'bubble-anime')
                .attr('r', d => d.r)
                //.attr('stroke', '#000000')
                //.attr('stroke-width', 2)
                .attr('fill', '#ADD8E6');

        simulation.on("tick", () => {
            animeGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        });


      }

}