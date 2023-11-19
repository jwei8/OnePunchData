class TopPackedBubbleChart {

    constructor(_config, _data, _genreToInfo, _dispatcher) {
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
        this.data = _data;
        this.genreToInfo = _genreToInfo;
        this.dispatcher = _dispatcher;
        this.clickedNode = null;
        this.initVis();
      }

      
    initVis() {
        let vis = this;

        vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        console.log(vis.config.width);
        console.log(vis.config.height);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth + vis.config.legendWidth)
            .attr('height', vis.config.containerHeight);

        vis.chartArea = vis.svg.append('g')
            .attr('class', 'top-level-group')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('width', vis.config.width)
            .attr('height', vis.config.height);

        vis.chartArea.append('rect')
            .attr('width', vis.config.width)
            .attr('height', vis.config.height)
            .attr('fill', 'transparent')
            .on('click', (event, d) => {
                if (!d3.select(event.currentTarget).classed('.top-level-bubble-group')) {
                    vis.zoomOut();
                }
            })
        
        vis.svg.append('rect')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('rx', 10)          
            .attr('ry', 10)          
            .attr('fill', 'none')   
            .attr('stroke', 'grey') 
            .attr('stroke-width', '2px');
        
        // cover the right side of the panel for legend
        vis.svg.append('rect')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendHeight * 2)
            .attr('rx', 10)          
            .attr('ry', 10)
            .attr('x', 800)   
            .attr('y', 0)       
            .attr('fill', 'white');

        //legend
        vis.svg.append('rect')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendHeight)
            .attr('rx', 10)          
            .attr('ry', 10)
            .attr('x', 800)   
            .attr('y', 0)       
            .attr('fill', 'white')   
            .attr('stroke', 'grey') 
            .attr('stroke-width', '2px');
        

        vis.pack = d3.pack()
            .size([vis.config.containerWidth, vis.config.containerHeight])
            .padding(15);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.groupedAnimes = d3.groups(vis.data, d => d.Genre);

        vis.groupedAnimesObjects = vis.groupedAnimes.map(([genre, animes]) => {
            return {genre: genre, count: animes.length, animes: animes};
        });

        vis.root = d3.hierarchy({ children: vis.groupedAnimesObjects })
            .sum(d => d.count);

        vis.nodes = vis.pack(vis.root).leaves();

        vis.renderVis();
    }

    renderVis() {
        // SOURCE: https://observablehq.com/@sharad/force-directed-bubble-chart

        let vis = this;

        vis.simulationActive = true;

        const simulation = d3.forceSimulation(vis.nodes)
            .force("x", d3.forceX(vis.config.width / 2).strength(0.5))
            .force("y", d3.forceY(vis.config.height / 2).strength(0.5))
            .force('charge', d3.forceManyBody().strength(500))
            .force("collision", d3.forceCollide().radius(d => d.r + 4).strength(0.8));

        vis.bubblesGroups = vis.chartArea.selectAll('.top-level-bubble-group')
                .data(vis.nodes, d => d.data.genre)
            .join('g')
                .attr('class', 'top-level-bubble-group')
                .attr("transform", d => `translate(${d.x}, ${d.y})`)
                //.attr('fill', 'none')
                .attr('opacity', 0.7);

        console.log(this.bubblesGroups);

        vis.bubbles = vis.bubblesGroups.selectAll('.bubble')
                .data(d => d, d => d.data.genre)
            .join('circle')
                .on('click', (event, d) => {
                    if (!vis.simulationActive) {
                        vis.zoomToBubble(d);
                    }
                })
                .attr('class', 'bubble')
                .attr('r', d => d.r)
                //.attr('stroke', '#000000')
                //.attr('stroke-width', 2)
                .attr('fill', d => vis.genreToInfo[d.data.genre].color);

        vis.genreText = vis.bubblesGroups.selectAll('.top-bubble-title')
                .data(d => d, d => d.data.genre)
            .join('text')
                .attr('class', 'top-bubble-title')
                .attr('dy', "0.25em")
                .attr('font-size', '15px')
                .attr('fill', 'black')
                .attr('font-weight', 'bold')
                .attr('text-anchor', 'middle')
                .text(d => d.data.genre)
                .attr("x", 0)
                .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.5}em`);
        
        
        vis.renderLegend();

        simulation.on("tick", () => {
            vis.bubblesGroups.attr("transform", d => `translate(${d.x},${d.y})`);
        }).on("end", () => {
            vis.simulationActive = false;
        });
    }


    zoomToBubble(currClickedNode) {
        let vis = this;
        const prevNode = vis.clickedNode;
        vis.clickedNode = currClickedNode;
    
        // Calculate the scale for zooming
        const targetRadius = Math.min(vis.config.width, vis.config.height) / 2;
        const scale = targetRadius / currClickedNode.r;
    
        // Calculate the translation needed to center the bubble
        // Adjust the translation to account for initial chart area translation
        const translateX = vis.config.width / 2 - scale * currClickedNode.x + vis.config.margin.left;
        const translateY = vis.config.height / 2 - scale * currClickedNode.y + vis.config.margin.top;

        // remove previous groups vis if it exists
        vis.svg.selectAll('.bubble-anime').transition()
            .duration(250)
            .attr('opacity', 0)
            .on('end', () => {
                vis.svg.select('.anime-level-group').remove()

                vis.genreText.each(function() {
                    let textElement = d3.select(this);
                    if (textElement.text() === prevNode.data.genre) {
                        // Apply fade-out transition to the matching element
                        textElement.transition()
                            .duration(750)
                            .style("opacity", 1);
                    }
                });
            });


        setTimeout(() => {
            // Start the zoom transition
            vis.genreText.each(function() {
                let textElement = d3.select(this);
                if (textElement.text() === currClickedNode.data.genre) {
                    // Apply fade-out transition to the matching element
                    textElement.transition()
                        .duration(750)
                        .style("opacity", 0);
                }
            });

            vis.chartArea.transition()
                .duration(750)
                .attr("transform", `translate(${translateX}, ${translateY}) scale(${scale})`)
                .on("end", () => {
                    vis.dispatcher.call('topToDrillDown', null, currClickedNode.data.genre, currClickedNode.data.animes);
                }); 

        }, 350);
    }

    zoomOut() {
        let vis = this;
        const prevNode = vis.clickedNode;
        vis.clickedNode = null;
        // remove previous groups vis if it exists
        vis.svg.selectAll('.bubble-anime').transition()
            .duration(250)
            .attr('opacity', 0)
            .on('end', () => {
                vis.svg.select('.anime-level-group').remove()

                vis.genreText.each(function() {
                    let textElement = d3.select(this);
                    if (textElement.text() === prevNode.data.genre) {
                        // Apply fade-out transition to the matching element
                        textElement.transition()
                            .duration(350)
                            .style("opacity", 1)
                            .on('end', () => {
                                vis.chartArea.transition()
                                                .duration(750)
                                                .attr("transform", `translate(${vis.config.margin.left},${vis.config.margin.top}) scale(1)`)
                            });
                    }
                });
            });
    }

    renderLegend() {
        let vis = this;
    
        const categories = [
          ["50+", "#b2e061", 50, vis.config.containerWidth + vis.config.legendWidth / 2, vis.config.legendHeight / 2 + 100],
          ["100+", "#ffee65", 80, vis.config.containerWidth + vis.config.legendWidth / 2, vis.config.legendHeight / 2 + 70],
          ["200+", "#7eb0d5", 120, vis.config.containerWidth + vis.config.legendWidth / 2, vis.config.legendHeight / 2 + 30],
          ["300+", "#fd7f6f", 150, vis.config.containerWidth + vis.config.legendWidth / 2, vis.config.legendHeight / 2]
      ].map(([name, color, r, x, y]) => ({ name, color, r, x, y }));

        vis.legendGroup = vis.svg.append('g')
            .attr('class', 'legend');
        
        const legendItems = vis.legendGroup.selectAll(".legend-item")
            .data(categories)
            .enter()
            .append('g')
            .attr('transform', d => `translate(${d.x},${d.y})`)
        
        // add legend text tittle
        vis.legendGroup.append('text')
        .style('font-size', 12)
        .attr('x', vis.config.containerWidth + vis.config.legendWidth / 2)
        .attr('text-anchor', 'middle')
        .attr('y', 30)
        .text("The # of Anime in the Genre");
    
        console.log(vis.config.containerWidth + vis.config.legendWidth / 2);
        //adding circles
        legendItems.append('circle')
          .attr('fill', 'none')
          .attr('stroke', d => d.color)
          .attr('stroke-width', 2)
          .attr('r', d => d.r);       

          legendItems.append('text')
          .style('font-size', 12)
          .attr('x',  d => d.x - 1000)
          .attr('y', d => d.y - 355)
          .attr('text-anchor', 'middle')
          .text(d => d.name);
      }
      
}