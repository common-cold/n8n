import { BezierEdge, EdgeLabelRenderer, getBezierPath, MarkerType, useEdges, useNodes, type EdgeProps } from "reactflow";
import { Plus, Trash } from "react-bootstrap-icons"; // Example icons
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";
import { useAtom, useSetAtom } from "jotai";
import { newNodeMetadataAtom, showNodeTypeListAtom } from "../../store/atoms";

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


  const {deleteNodeAndEdge} = useCommonReactFlowFunctions();
  const setShowNodeTypeList = useSetAtom(showNodeTypeListAtom);
  const setNewNodeMetadata = useSetAtom(newNodeMetadataAtom);

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
            onClick={() => deleteNodeAndEdge(props.target, props.source)}
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
            onClick={(e) => {
              const {clientX, clientY} = e;
              setNewNodeMetadata({x: clientX, y: clientY, sourceNode: props.source});
              setShowNodeTypeList(true);
            }}
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