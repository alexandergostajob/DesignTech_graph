import React from 'react';
import { Panel, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
 
function downloadImage(dataUrl) {
  const a = document.createElement('a');
 
  a.setAttribute('download', 'reactflow.png');
  a.setAttribute('href', dataUrl);
  a.click();
}
 
const imageWidth = 1024;
const imageHeight = 768;
 
function DownloadButton() {
  const { getNodes } = useReactFlow();
  const onClick = () => {
    // we calculate a transform for the nodes so that all nodes are visible
    // we then overwrite the transform of the `.react-flow__viewport` element
    // with the style option of the html-to-image library
    const nodesBounds = getNodesBounds(getNodes());
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);
 
    toPng(document.querySelector('.react-flow'), {
      backgroundColor: undefined,
      width: imageWidth,
      height: imageHeight,
      style: {
        width: imageWidth,
        height: imageHeight,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
      filter: (node) => {
        // optionally skip unwanted DOM elements
        return true;
      },
    }).then(downloadImage);
  };
 
  return (
    <Panel position="top-right">
      <button className="download-btn xy-theme__button" onClick={onClick}>
        Download Image
      </button>
    </Panel>
  );
}
 
export default DownloadButton;