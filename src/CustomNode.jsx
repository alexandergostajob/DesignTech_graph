import { memo } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

const CustomNode = ({ data, selected }) => {
  const baseSize = 8;
  const scale = (Math.log(10*data.size)); // dampens size growth
  const padding = baseSize * scale;

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: 4 }}>
          <strong>{data.type}</strong>{data.description ? `: ${data.description}` : ''}
        </div>
      </NodeToolbar>

      <div
        style={{
          padding: `${padding / 4}px ${padding / 2}px`,
          backgroundColor: data.color,
          border: '1px solid #aaa',
          borderRadius: 6,
          textAlign: 'center',
          fontSize: `${10 + scale * 2}px`,
          opacity: data.isDimmed ? 0.2 : 1,
          transition: 'opacity 0.3s'
        }}
      >
        {data.label}
      </div>

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default memo(CustomNode);
