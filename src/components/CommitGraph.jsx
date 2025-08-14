import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useGitData } from '../context/GitDataContext';
import '../styles/CommitGraph.css';

const CommitGraph = ({ branch, onCommitSelect, selectedCommit }) => {
  const svgRef = useRef(null);
  const { commits } = useGitData();

  useEffect(() => {
    if (!commits.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1200;
    const height = 200;
    const nodeRadius = 20;
    const nodeSpacing = 100;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g')
      .attr('transform', 'translate(50, 100)');

    const connections = g.append('g').attr('class', 'connections');
    const nodes = g.append('g').attr('class', 'nodes');

    commits.forEach((commit, i) => {
      if (i > 0) {
        connections.append('line')
          .attr('x1', (i - 1) * nodeSpacing)
          .attr('y1', 0)
          .attr('x2', i * nodeSpacing)
          .attr('y2', 0)
          .attr('stroke', '#666')
          .attr('stroke-width', 2);
      }
    });

    const nodeGroups = nodes.selectAll('.commit-node')
      .data(commits)
      .enter()
      .append('g')
      .attr('class', 'commit-node')
      .attr('transform', (d, i) => `translate(${i * nodeSpacing}, 0)`);

    nodeGroups.append('circle')
      .attr('r', nodeRadius)
      .attr('fill', d => d.hash === selectedCommit?.hash ? '#ff4444' : '#4a9eff')
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => onCommitSelect(d))
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', nodeRadius + 5);

        const tooltip = d3.select('body').append('div')
          .attr('class', 'commit-tooltip')
          .style('opacity', 0);

        tooltip.transition()
          .duration(200)
          .style('opacity', .9);

        tooltip.html(`
          <strong>${d.hash.substring(0, 7)}</strong><br/>
          ${d.message}<br/>
          <span class="author">${d.author}</span><br/>
          <span class="stats">+${d.stats?.insertions || 0} -${d.stats?.deletions || 0}</span>
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 60) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', nodeRadius);

        d3.selectAll('.commit-tooltip').remove();
      });

    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('fill', '#fff')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text((d, i) => d.hash.substring(0, 4));

    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 45)
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .text(d => {
        const msg = d.message.split('\n')[0];
        return msg.length > 15 ? msg.substring(0, 12) + '...' : msg;
      });

    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [commits, selectedCommit]);

  return (
    <div className="commit-graph">
      <div className="graph-header">
        <h3>Commit History</h3>
        <span className="commit-count">{commits.length} commits</span>
      </div>
      <svg ref={svgRef} className="commit-graph-svg"></svg>
    </div>
  );
};

export default CommitGraph;