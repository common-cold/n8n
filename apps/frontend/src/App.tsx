import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Homepage } from './components/Hompage';
import { WorkflowPage } from './components/WorkflowPage';
import { Toaster } from 'react-hot-toast';
import { ReactFlowProvider } from 'reactflow';
import { NodeEditPage } from './components/NodeEditPage';
import { AuthPage } from './components/auth/AuthPage';


function App() {
  return(
      <ReactFlowProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage/>} />
            <Route path="/homepage" element={<Homepage/>} />
            <Route path="/workflows/:id" element={<WorkflowPage/>}>
              <Route path="edit/:pageId" element={<NodeEditPage/>}></Route>
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
