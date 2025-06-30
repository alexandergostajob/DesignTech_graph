import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
} from 'd3-force';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Panel,
  MiniMap,
  addEdge,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useNodesInitialized,
} from '@xyflow/react';
 
import { collide } from './collide.js';
import FloatingEdge from './FloatingEdge';
import FloatingConnectionLine from './FloatingConnectionLine';
import { initialElements } from './initialElements.js';
import CustomNode from './CustomNode';
import ArrangeButton from './ArrangeButton';


import '@xyflow/react/dist/style.css';
 
const simulation = forceSimulation()
  .force('charge', forceManyBody().strength(-1000))
  .force('x', forceX().x(0).strength(0.05))
  .force('y', forceY().y(0).strength(0.05))
  .force('collide', collide())
  .alphaTarget(0.05)
  .stop();

const useLayoutedElements = () => {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();
  const initialized = useNodesInitialized();
 
  // You can use these events if you want the flow to remain interactive while
  // the simulation is running. The simulation is typically responsible for setting
  // the position of nodes, but if we have a reference to the node being dragged,
  // we use that position instead.
  const draggingNodeRef = useRef(null);
  const dragEvents = useMemo(
    () => ({
      start: (_event, node) => (draggingNodeRef.current = node),
      drag: (_event, node) => (draggingNodeRef.current = node),
      stop: () => (draggingNodeRef.current = null),
    }),
    [],
  );
 
  return useMemo(() => {
    let nodes = getNodes().map((node) => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
    }));
    let edges = getEdges().map((edge) => edge);
    let running = false;
 
    // If React Flow hasn't initialized our nodes with a width and height yet, or
    // if there are no nodes in the flow, then we can't run the simulation!
    if (!initialized || nodes.length === 0) return [false, {}, dragEvents];
 
    simulation.nodes(nodes).force(
      'link',
      forceLink(edges)
        .id((d) => d.id)
        .strength(0.05)
        .distance(100),
    );
 
    // The tick function is called every animation frame while the simulation is
    // running and progresses the simulation one step forward each time.
    const tick = () => {
      getNodes().forEach((node, i) => {
        const dragging = draggingNodeRef.current?.id === node.id;
 
        // Setting the fx/fy properties of a node tells the simulation to "fix"
        // the node at that position and ignore any forces that would normally
        // cause it to move.
        if (dragging) {
          nodes[i].fx = draggingNodeRef.current.position.x;
          nodes[i].fy = draggingNodeRef.current.position.y;
        } else {
          delete nodes[i].fx;
          delete nodes[i].fy;
        }
      });
 
      simulation.tick();
      setNodes(
        nodes.map((node) => ({
          ...node,
          position: { x: node.fx ?? node.x, y: node.fy ?? node.y },
        })),
      );
 
      window.requestAnimationFrame(() => {
        // Give React and React Flow a chance to update and render the new node
        // positions before we fit the viewport to the new layout.
        fitView();
 
        // If the simulation hasn't been stopped, schedule another tick.
        if (running) tick();
      });
    };
 
    const toggle = () => {
      if (!running) {
        getNodes().forEach((node, index) => {
          let simNode = nodes[index];
          Object.assign(simNode, node);
          simNode.x = node.position.x;
          simNode.y = node.position.y;
        });
      }
      running = !running;
      running && window.requestAnimationFrame(tick);
    };
 
    const isRunning = () => running;
 
    return [true, { toggle, isRunning }, dragEvents];
  }, [initialized, dragEvents, getNodes, getEdges, setNodes, fitView]);
};

const edgeTypes = { floating: FloatingEdge };

const { nodes: initialNodes, edges: initialEdges } = initialElements();



const LayoutFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const highlightedNodes = new Set();
  const highlightedEdges = new Set();
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  if (selectedNodeId) {
    edges.forEach(edge => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        highlightedEdges.add(edge.id);
        highlightedNodes.add(edge.source);
        highlightedNodes.add(edge.target);
    }
  });
}

const styledNodes = nodes.map(node => ({
  ...node,
  data: {
    ...node.data,
    isDimmed: selectedNodeId ? !highlightedNodes.has(node.id) : false,
  },
}));

const styledEdges = edges.map(edge => ({
  ...edge,
  data: {
    ...edge.data,
    isDimmed: selectedNodeId ? !highlightedEdges.has(edge.id) : false,
  },
}));

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'floating',
          },
          eds,
        ),
      ),
    [setEdges],
  );
  const [initialized, { toggle, isRunning }, dragEvents] =
    useLayoutedElements();

 const handleArrange = (arrangeBy) => {
  const sortedNodes = [...nodes].sort((a, b) => {
    const aVal = a.data[arrangeBy]?.toLowerCase() || '';
    const bVal = b.data[arrangeBy]?.toLowerCase() || '';
    return aVal.localeCompare(bVal);
  });

  const radius = 500;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const angleStep = (2 * Math.PI) / sortedNodes.length;

  const newNodes = sortedNodes.map((node, i) => {
    const angle = i * angleStep;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });

  setNodes(newNodes);
};


  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        
        edgeTypes={edgeTypes}
        nodeTypes={{custom: CustomNode}}
        onPaneClick={() => setSelectedNodeId(null)}
        nodes={styledNodes}
        edges={styledEdges}
        onNodeDragStart={dragEvents.start}
        onNodeDrag={dragEvents.drag}
        onNodeDragStop={dragEvents.stop}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onConnect={onConnect}
        connectionLineComponent={FloatingConnectionLine}
      >

        <Panel position="top-left">
          {initialized && (
            <>
              <button onClick={toggle} style={{ marginRight: '5px' }}>
                {isRunning() ? 'Stop' : 'Start'} force simulation
              </button>
            </>
          )}
        </Panel>
        <MiniMap />
        <Controls />
        <ArrangeButton arrangeBy="label" onClick={handleArrange} position="top-right" />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};
 
export default function () {
  return (
    <ReactFlowProvider>
      <LayoutFlow />
    </ReactFlowProvider>
  );
}