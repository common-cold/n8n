import { BezierEdge, EdgeLabelRenderer, getBezierPath, MarkerType, SmoothStepEdge, useEdges, useNodes, type EdgeProps } from "reactflow";
import { Plus, Trash } from "react-bootstrap-icons";
import { useCommonReactFlowFunctions } from "../../hooks/react-flow-hooks";
import { useAtom, useSetAtom } from "jotai";
import { newNodeMetadataAtom, nodeTypeToShow, showNodeTypeListAtom } from "../../store/atoms";

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
  const setNodeTypeToShow = useSetAtom(nodeTypeToShow);

  return (
    <>
      <BezierEdge
        {...props}
        style={{
          ...props.style,
          strokeWidth: "3px",
          ...((props.sourceHandleId === "tool-handle" || props.sourceHandleId === "llm-handle") && {strokeDasharray: '8 4'})
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
          {
            (props.sourceHandleId !== "tool-handle" && props.sourceHandleId !== "llm-handle")
            &&
            <button
              onClick={(e) => {
                const {clientX, clientY} = e;
                setNewNodeMetadata({x: clientX, y: clientY, sourceNode: props.source});
                setNodeTypeToShow("basic")
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
          }
          
        </div>
      </EdgeLabelRenderer>
    </>
  );
}