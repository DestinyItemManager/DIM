import HTML5 from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';

// This is separate so that it won't get messed up by hot reloading
export default DragDropContext(HTML5);
