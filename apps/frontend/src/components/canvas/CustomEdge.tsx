import { BezierEdge, EdgeLabelRenderer, getBezierPath, MarkerType, useEdges, useNodes, type EdgeProps } from "reactflow";
import { X, Pencil, Plus, Trash } from "react-bootstrap-icons"; // Example icons
import { useEffect, useRef } from "react";

export function CustomEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const setEdges = useEdges();
  const setNodes = useNodes();


  return (
    <>
      <BezierEdge 
        {...props}
        style={{
          ...props.style,
          strokeWidth: "3px"
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            display: "flex",
            gap: "6px",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => console.log("delete edge", id)}
            style={{
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "50%",
              padding: "4px",
              cursor: "pointer",
            }}
          >
            <Trash />
          </button>
          <button
            onClick={() => console.log("add node", id)}
            style={{
              background: "white",
              border: "1px solid #ccc",
              borderRadius: "50%",
              padding: "4px",
              cursor: "pointer",
            }}
          >
            <Plus />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}