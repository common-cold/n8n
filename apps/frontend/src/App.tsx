import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Homepage } from './components/Hompage';
import { WorkflowPage } from './components/WorkflowPage';
import { Toaster } from 'react-hot-toast';
import { ReactFlowProvider } from 'reactflow';
import { NodeConfigModal } from './components/NodeConfigurationModal';


function App() {
  return(
      <ReactFlowProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Homepage/>} />
            <Route path="/workflows/:id" element={<WorkflowPage/>}>
              <Route path=":pageId" element={<NodeConfigModal/>}></Route>
            </Route>
          </Routes>
          <Toaster
            position="bottom-center"
            reverseOrder={false}
          />
        </BrowserRouter>
      </ReactFlowProvider> 
  );
}

export default App
