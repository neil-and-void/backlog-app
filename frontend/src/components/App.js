import React from 'react';
import { render } from "react-dom";
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import './index.css';

var colCount = 3;
var taskCount = 5;

var columnNumber = 0;
var taskNumber = 0;

function Task(props){
  return(
    <Draggable 
      draggableId={props.taskId} 
      index={props.index}
    >
      {(provided, snapshot) => (
        <div className="taskBox"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div>
            {props.taskDesc}
          </div>
          <br/>
          <br/>
          <button
              className="deleteTaskButton"
              onClick={props.deleteTaskCallback} //TODO
            >Delete</button>
        </div>
        
      )}
    </Draggable>


  );
}

function Column(props){
  return (
    <div>
      <div>
        <div className="columnTitle">
          {props.columnName}
        </div>
        <div className="columnButtons">
          <button 
            className="addTaskButton"
            onClick={props.addTaskCallback} >+Add Task</button>
          <button 
            className="columnDeleteButton" 
            onClick={props.deleteColumnCallback}>Delete
          </button>
        </div>
      </div>
      <div >
      <Droppable droppableId={props.columnId}>
        {(provided) => {
            const taskIds = props.taskIds;
            const tasks = props.tasks;
            return (
              <div 
                className="columnBody"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                  {taskIds.map((key,index) => {
                    const task = tasks[key];
                    return (
                      <Task
                        key={key}
                        taskId={key}
                        columnId={props.columnId}
                        taskDesc={task.taskDesc}
                        index={index}
                        deleteTaskCallback={() => props.deleteTaskCallback(props.columnId, key, index)}/>
                    )
                  })}
              {provided.placeholder}
            </div>
          )}}
      </Droppable>
      </div>
      </div>

  )
}


// ProjectBoard maintains state of the project 
class ProjectBoard extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      tasks:{},
      columns:{},
      columnIds:[],
      newTask:"",
      newColumn:"",
      title:"",
      projectId:"",
    }
    this.handleColumnNameChange = this.handleColumnNameChange.bind(this);
    this.handleTaskNameChange = this.handleTaskNameChange.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);    
  }

  componentDidMount(){
    let projectDataObject = {};
    let taskObjects = {};
    let columnId;

    
    // fetch columns, project, tasks
    fetch('/backlog/api/project/'+this.props.projectid)

      // add project response data to our temp object
      .then((responseProject) => {
        return responseProject.json()
      })
      .then(projectObj => {
        projectDataObject['project'] = projectObj[0]
        
      })
      // add column response data to our temp object
      .then(
        fetch('/backlog/api/column/'+this.props.projectid)
        .then((responseColumn) => {
          return responseColumn.json()
        })
        .then((columnObjs) => {
          projectDataObject['columns'] = columnObjs
          
          // iterate through columns
          let taskFetches = [];
          for(let column of columnObjs){
            taskFetches.push(
              fetch('/backlog/api/task/'+column.columnId)
              .then(response => {return response.json()})
              .then((taskObjs) => {
                return Promise.all(taskObjs)
              })
              .then((columnTasks) => {
                taskObjects[column.columnId] = columnTasks 
                projectDataObject['tasks'] = taskObjects
              })
            );
          }
          Promise.all(taskFetches)
            .then(() => {
              this.initializeStateFromData(projectDataObject)
            })

        })
      )       
  }

  initializeStateFromData(dataObject){
    //console.log(dataObject)
    let newState = this.state;

    // set project id
    newState['projectId'] = dataObject['project']['projectId']

    // set title
    newState['title']=dataObject.project.projectName

    // get column objects array and sort ascending
    let columnObjects = dataObject.columns;
    columnObjects.sort((c1,c2) => parseInt(c1.columnNumber) - parseInt(c2.columnNumber))
    for(let column of columnObjects){

      let columnId = column['columnId'].toString()

      // column array 
      newState.columnIds.push(columnId)

      // create task array for column 
      let taskObjects = dataObject['tasks'][columnId]
      let taskIdArray = []
      for(let task of taskObjects){
        
        let taskId = task['taskId'].toString()

        // task id list in column
        taskIdArray.push(taskId)

        // create new task and add to tasks
        let newTask = {
          'id': taskId,
          'taskDesc':task.description,
        }
        
        newState.tasks[taskId] = newTask

      }

      // create column object 
      const columnObject = {
        'id':columnId, 
        'columnName':column.columnName, 
        'taskIds':taskIdArray
      }

      // add to new state
      newState.columns[columnId] = columnObject

    }
    console.log(newState)
    this.setState(newState)

  }

  renderColumnSpace(){
    const columns = this.state.columns;
    const columnIds = this.state.columnIds;
    const tasks = this.state.tasks;

    return (
      <div className='columnSpace'>
        {
        columnIds.map((key,index) => {
          const column = columns[key];
          return (
            <div
              key={key}
              className="column"
              >
              <Column 
                 // TODO FIX PROBLEM WITH UNIQUE KEY
                columnId={key} 
                taskIds={column.taskIds}
                tasks={tasks}
                columnName={column.columnName}
                deleteColumnCallback={() => {this.handleDeleteColumnClick(key, index)}}
                addTaskCallback={() => {this.handleNewTaskClick(key)}}
                deleteTaskCallback={this.handleDeleteTaskClick}
              />
            </div>
            
          )
        })}
      </div>
    )
  }

          
  // TODO: should also add to database
  handleNewColumnClick(){
    let currentState = this.state;
    let newColumnName = currentState.newColumn;

    // check if input is not blank
    if(newColumnName){
      
      // post to database
      let url = '/backlog/api/column/'+currentState.projectId+'/';
      let data = {
        'columnNumber': currentState.columnIds.length,
        'columnName': newColumnName,
        'projectId':currentState.projectId,
      }
      postChangesToServer(url, 'POST', data)
        .then((response) => response.json())
        .then(result => {

          let columnId = result.columnId.toString()
          currentState.columnIds.push(columnId);

          // add to columns object
          currentState.columns[columnId] = {id: columnId, columnName:newColumnName , taskIds:[]} ;

          // reset input form 
          currentState.newColumn='';

          this.setState(currentState);
        })
        .catch((error) => {
          console.error('Error:', error)
        })

      
    }
  } 

  handleColumnNameChange(event){
    let newState = this.state;
    newState.newColumn = event.target.value;
    this.setState(newState);
  }

  handleDeleteColumnClick(columnId, index){
    let newState = this.state;
    let tasksToDelete = newState.columns[columnId].taskIds;

    let url = '/backlog/api/column/' + columnId + '/'
    let data = {
      'columnId':columnId
    }

    postChangesToServer(url,'DELETE',data)
      .then(() => {
    
        // delete from tasks object
        for(let task of tasksToDelete){
          delete newState.tasks[task];
        }

        // delete from columns object
        delete newState.columns[columnId];

        // delete from columnIds array 
        newState.columnIds.splice(index,1);

        this.setState(newState);

      })
  }

  
  handleNewTaskClick(columnId){
    let currentState = this.state;
    let newTaskDesc = currentState.newTask;

    if(newTaskDesc){
      let url = '/backlog/api/task/' + columnId + '/'
      let data = {
        'description':newTaskDesc,
        'columnId':columnId,
      }
      // post to database
      postChangesToServer(url, 'POST', data)
      .then((response) => response.json())
      .then(result => {

        // add to tasks object
        let taskId = result.taskId.toString()
        currentState.tasks[taskId] = {id: taskId, taskDesc: newTaskDesc};

        // add task ids to column 
        currentState.columns[columnId].taskIds.push(taskId);

        // clear input 
        currentState.newTask = '';
        this.setState(currentState);

      })
      .catch((error) => {
        console.error('Error:', error)
      })
    }
  }


  handleTaskNameChange(event){
    let newState = this.state;
    newState.newTask = event.target.value;
    this.setState(newState);
  }

  handleDeleteTaskClick = (columnId, taskId, taskIndex) =>{
    const currentState = this.state;

    let url = '/backlog/api/task/' + columnId + '/';
    let data = {
      'taskId': parseInt(taskId),
      'columnId': parseInt(columnId),
    }
    postChangesToServer(url, 'DELETE', data)
      .then(() => {
            // remove task from columns object 
        currentState.columns[columnId].taskIds.splice(taskIndex,1);
        console.log(currentState)

        // remove task from tasks object
        delete currentState.tasks[taskId];

        this.setState(currentState);

      })


  }

  onDragEnd(result){
    // check if destination valid
    const {destination, source, draggableId} = result;
    if(!destination){
      return;
    }
    
    // check if draggable location has changed
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const beginColumn= this.state.columns[source.droppableId];
    const endColumn = this.state.columns[destination.droppableId];

    // dragging into same column
    if(beginColumn === endColumn){
      const column = this.state.columns[source.droppableId];
      const newTaskIds = Array.from(beginColumn.taskIds);

      // remove from source column
      newTaskIds.splice(source.index, 1);
  
      // add to destination column at index
      newTaskIds.splice(destination.index, 0, draggableId);
  
      // create new column
      const newColumn = {
        ...column,
        taskIds: newTaskIds,
      }
  
      // add new column to state
      const newState = {
        ...this.state,
        columns:{
          ...this.state.columns,
          [newColumn.id]:newColumn,
        }
      };
  
      this.setState(newState)
      return;
    } 
    
    // dragging between columns
    else {

      // make drag persistent
      let url = '/backlog/api/task/' + endColumn.id + '/'
      let data = {
        'taskId': draggableId
      }
      postChangesToServer(url, 'PATCH', data)
        .then(() => {

        })

      

      // remove task from source column
      const beginTaskIds = beginColumn.taskIds;
      const draggedTask = beginTaskIds.splice(source.index, 1);
      const newBegin = {
        ...beginColumn,
        taskIds:beginTaskIds,
      };

      // add task to destination column at index
      const endTaskIds= endColumn.taskIds;
      endTaskIds.splice(destination.index, 0, draggedTask[0]);
      const newEnd = {
        ...endColumn,
        taskIds: endTaskIds,
      };

      // create and set state
      const newState = {
        ...this.state,
        columns: {
          ...this.state.columns,
          [newBegin.id]: newBegin,
          [newEnd.id]: newEnd,
        },
      };
      this.setState(newState);
      console.log(this.state);
      return;
    }
  }
  
  render(){
    return (
      <div className="project">
        <h1 className='projectTitle'>{this.state['title']}</h1>
          <DragDropContext onDragEnd={this.onDragEnd}>
            {this.renderColumnSpace()}
          </DragDropContext>
        <div className="controls">
          <div className="addColumn">
            <input className="input" input="text" value={this.state.newColumn} onChange={this.handleColumnNameChange}/>
            <button className="addColumnButton" onClick={() => this.handleNewColumnClick()}>+Add Column</button>
          </div>
          
          <div className="addTask">
            New task here:
            <input className="input" input="text" value={this.state.newTask} onChange={this.handleTaskNameChange}/>
          </div>
        </div>
      </div>
    );
  }
}

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

function postChangesToServer(url, method, data){
  let csrftoken = getCookie('csrftoken');

  return fetch(url, {
    method: method,
    headers: {
      'Accept': 'application/json, text/plain, */*',
      "Content-Type": "application/json",
      'X-CSRFToken': csrftoken
    },
    body: JSON.stringify(data)
  })
  .catch((error) => {
    console.error('Error:', error)
  })

}


//===================================
export default ProjectBoard;

const container = document.getElementById("app");
render(<ProjectBoard {...(container.dataset)}/>, container);