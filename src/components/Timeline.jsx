import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useGitData } from '../context/GitDataContext';
import '../styles/Timeline.css';

const Timeline = ({ branch, currentTime, onTimeChange, onCommitSelect }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const { commits, fetchCommits } = useGitData();
  const [dimensions, setDimensions] = useState({ width: 0, height: 100 });

  useEffect(() => {
    if (branch) {
      fetchCommits(branch);
    }
  }, [branch]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 100
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!commits.length || !dimensions.width) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 30, left: 30 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const timestamps = commits.map(c => new Date(c.date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    const xScale = d3.scaleTime()
      .domain([new Date(minTime), new Date(maxTime)])
      .range([0, width]);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('line')
      .attr('class', 'timeline-axis')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', '#444')
      .attr('stroke-width', 2);

    const commitGroups = g.selectAll('.commit-marker')
      .data(commits)
      .enter()
      .append('g')
      .attr('class', 'commit-marker')
      .attr('transform', d => `translate(${xScale(new Date(d.date))}, ${height / 2})`);

    commitGroups.append('circle')
      .attr('r', 6)
      .attr('fill', '#4a9eff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        onCommitSelect(d);
        onTimeChange(new Date(d.date).getTime());
      })
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 8);
        
        const tooltip = d3.select('body').append('div')
          .attr('class', 'timeline-tooltip')
          .style('opacity', 0);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        tooltip.html(`
          <strong>${d.message}</strong><br/>
          ${d.author}<br/>
          ${new Date(d.date).toLocaleString()}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6);
        
        d3.selectAll('.timeline-tooltip').remove();
      });

    const currentTimeMarker = g.append('line')
      .attr('class', 'current-time-marker')
      .attr('x1', xScale(new Date(currentTime || minTime)))
      .attr('x2', xScale(new Date(currentTime || minTime)))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#ff4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%m/%d %H:%M'));

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#888');

  }, [commits, dimensions, currentTime]);

  return (
    <div ref={containerRef} className="timeline">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default Timeline;