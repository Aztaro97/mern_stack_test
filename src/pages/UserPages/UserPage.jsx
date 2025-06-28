import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../contexts/AuthContext";
import { taskAPI } from "../../utils/api";
import UserSidebar from "./UserSidebar";

// Custom debounce hook
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

const UserPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressUpdating, setProgressUpdating] = useState({}); // Track which tasks are being updated
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    progress: 0,
  });

  const { user, isAuthenticated } = useAuth();

  // Load tasks from server API
  const loadTasks = async () => {
    if (!isAuthenticated) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await taskAPI.getTasks();
      
      if (response.success) {
        setTasks(response.data);
      } else {
        throw new Error(response.message || 'Failed to load tasks');
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      toast.error('Failed to load tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [isAuthenticated]);

  // Handle Task Creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority.toLowerCase(),
        dueDate: newTask.dueDate || null,
        progress: newTask.progress || 0
      };

      const response = await taskAPI.createTask(taskData);
      
      if (response.success) {
        // Add the new task to the local state
        setTasks(prevTasks => [...prevTasks, response.data]);
        
        toast.success("Task added successfully!", { icon: "✅" });

        // Reset form
        setNewTask({ 
          title: "", 
          description: "", 
          priority: "medium", 
          dueDate: "", 
          progress: 0 
        });
      } else {
        throw new Error(response.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error(err.message || 'Failed to create task. Please try again.');
    }
  };

  // Handle Task Deletion
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await taskAPI.deleteTask(taskId);
      
      if (response.success) {
        // Remove task from local state
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
        toast.error("Task removed successfully!", { icon: "🗑️" });
      } else {
        throw new Error(response.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error(err.message || 'Failed to delete task. Please try again.');
    }
  };

  // Debounced API call for progress updates
  const debouncedProgressUpdate = useDebounce(async (taskId, progress) => {
    try {
      setProgressUpdating(prev => ({ ...prev, [taskId]: true }));
      
      const response = await taskAPI.updateTaskProgress(taskId, progress);
      
      if (response.success) {
        // Update task status based on server response (in case of auto-completion)
        setTasks(prevTasks => 
          prevTasks.map(task =>
            task._id === taskId 
              ? { ...task, status: response.data.status }
              : task
          )
        );
        
        // Show completion message if task was automatically marked as complete
        if (progress === 100 && response.data.status === 'complete') {
          toast.success("🎉 Task completed!", { icon: "✅" });
        }
      } else {
        throw new Error(response.message || 'Failed to update progress');
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      toast.error(err.message || 'Failed to update progress. Please try again.');
      
      // Revert optimistic update on error
      loadTasks();
    } finally {
      setProgressUpdating(prev => ({ ...prev, [taskId]: false }));
    }
  }, 500); // 500ms delay

  // Handle Progress Update with optimistic UI updates
  const updateProgress = (taskId, progress) => {
    const progressValue = parseInt(progress);
    
    // Optimistic update - immediately update UI
    setTasks(prevTasks => 
      prevTasks.map(task =>
        task._id === taskId 
          ? { ...task, progress: progressValue }
          : task
      )
    );
    
    // Debounced API call
    debouncedProgressUpdate(taskId, progressValue);
  };

  // Function to get priority color
  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === "high") return "text-red-600 font-bold";
    if (priorityLower === "medium") return "text-yellow-600 font-bold";
    return "text-green-600 font-bold"; // Low priority
  };

  // Function to format priority display
  const formatPriorityDisplay = (priority) => {
    const priorityLower = priority?.toLowerCase();
    if (priorityLower === "high") return "🔥 High Priority";
    if (priorityLower === "medium") return "⚡ Medium Priority";
    return "✅ Low Priority";
  };

  // Function to get progress bar color based on completion
  const getProgressBarColor = (progress) => {
    if (progress === 100) return "accent-green-600";
    if (progress >= 75) return "accent-blue-600";
    if (progress >= 50) return "accent-yellow-600";
    if (progress >= 25) return "accent-orange-600";
    return "accent-red-600";
  };

  // Show authentication message if not logged in
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <UserSidebar />
        <div className="flex flex-1 justify-center items-center p-6">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access your tasks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <UserSidebar />

      <div className="flex-1 p-6">
        <h1 className="mb-6 w-full text-4xl font-bold text-center">
          <span>🎯</span> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            User Task Management
          </span>
        </h1>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

        {/* Task Creation Box */}
        <div className="p-6 mb-8 w-full max-w-lg bg-white rounded-lg border border-gray-200 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">Create a New Task</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Task Title</label>
              <input
                type="text"
                placeholder="Enter task title"
                className="p-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                placeholder="Enter task description"
                className="p-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  className="p-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="high">🔥 High Priority</option>
                  <option value="medium">⚡ Medium Priority</option>
                  <option value="low">✅ Low Priority</option>
                </select>
              </div>

              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700">Deadline</label>
                <input
                  type="date"
                  className="p-3 w-full rounded-lg border focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <button
              type="submit"
              className="p-3 w-full text-lg font-semibold text-white bg-blue-600 rounded-lg transition-all hover:bg-blue-700"
            >
              ➕ Add Task
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
            <span className="ml-4 text-gray-600">Loading tasks...</span>
          </div>
        ) : (
          /* Task List */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-lg text-gray-600">No tasks created yet. Start by adding a task!</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div key={task._id} className="p-4 bg-white rounded-md border-l-4 border-blue-400 shadow-md">
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-gray-600">{task.description}</p>

                  <span className={`text-sm ${getPriorityColor(task.priority)}`}>
                    Priority: {formatPriorityDisplay(task.priority)}
                  </span>

                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-semibold">Assigned To:</span> {user?.fullName || 'You'}
                  </p>

                  {task.dueDate && (
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-semibold">Deadline:</span> {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}

                  {/* Task Status */}
                  <p className="mt-1 text-sm text-gray-700">
                    <span className="font-semibold">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      task.status === 'complete' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status === 'complete' ? 'Complete' : 'In Progress'}
                    </span>
                    {progressUpdating[task._id] && (
                      <span className="ml-2 text-xs text-blue-600">
                        <span className="inline-flex items-center">
                          <svg className="mr-1 -ml-1 w-3 h-3 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      </span>
                    )}
                  </p>

                  {/* Task Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">Progress:</label>
                      <span className={`text-sm font-medium ${
                        task.progress === 100 ? 'text-green-600' : 'text-gray-700'
                      }`}>
                        {task.progress || 0}% 
                        {task.progress === 100 && <span className="ml-1">🎉</span>}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.progress || 0}
                      onChange={(e) => updateProgress(task._id, e.target.value)}
                      className={`mt-2 w-full ${getProgressBarColor(task.progress || 0)} transition-all duration-200`}
                      style={{
                        background: `linear-gradient(to right, 
                          ${task.progress === 100 ? '#10b981' : '#3b82f6'} 0%, 
                          ${task.progress === 100 ? '#10b981' : '#3b82f6'} ${task.progress || 0}%, 
                          #e5e7eb ${task.progress || 0}%, 
                          #e5e7eb 100%)`
                      }}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {progressUpdating[task._id] ? (
                        <span className="text-blue-600">Updating progress...</span>
                      ) : (
                        <span>
                          {task.progress === 0 && "Not started"}
                          {task.progress > 0 && task.progress < 25 && "Just started"}
                          {task.progress >= 25 && task.progress < 50 && "Making progress"}
                          {task.progress >= 50 && task.progress < 75 && "Halfway there"}
                          {task.progress >= 75 && task.progress < 100 && "Almost done"}
                          {task.progress === 100 && "Completed! ✨"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-2 mt-4 w-full font-semibold text-white bg-red-600 rounded-lg transition-all hover:bg-red-700"
                  >
                    🗑️ Delete Task
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;
