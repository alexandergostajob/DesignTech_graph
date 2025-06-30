import { Panel } from '@xyflow/react';

function ArrangeButtonPanel({ onClick, position = 'top-right' }) {
  return (
    <Panel position={position} style={{ display: 'flex', gap: '6px' }}>
      <button onClick={() => onClick('label')}>
        Arrange by Name
      </button>
      <button onClick={() => onClick('type')}>
        Arrange by Type
      </button>
    </Panel>
  );
}

export default ArrangeButtonPanel;
