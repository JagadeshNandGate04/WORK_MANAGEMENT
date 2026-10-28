import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from "redux";
import authReducer from "../store/auth/authSlice"
import dashboardReducer from "../store/dashboard/dashBoardSlice"
import projectReducer from "../store/project/projectSlice"
import memberReducer from '../store/member/memberSlice';
import taskReducer from "../store/task/taskSlice";
import reportReducer from './report/reportSlice';
import chatReducer from "../store/chat/chatSlice";





// Combined reducers
const rootReducer = combineReducers({
  auth: authReducer,
  dashboard: dashboardReducer,
  project: projectReducer,
  member: memberReducer,
  task: taskReducer,
  report: reportReducer,
  chat: chatReducer,
});

export const store = configureStore({
  reducer: rootReducer

});

// Type definitions
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;