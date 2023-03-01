import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlices";

//const USERS_URL = 'https://jsonplaceholder.typicode.com/users';
 
const usersAdapters = createEntityAdapter()

const initialState = usersAdapters.getInitialState()


export const userApiSlice  = apiSlice.injectEndpoints({
    endpoints: builder =>({
        getUsers: builder.query({
            query:()=>'/users',
            transformResponse:responseData=>{
                return usersAdapters.setAll(initialState,responseData)
            },
            providesTags: (result,error,arg)=>[
                {type:'user',id:"LIST"},
                ...result.ids.map(id => ({type:'User',id}))
            ]
        })
    })
})
export const {
 useGetUsersQuery
} = userApiSlice
//return query reuslt object
export const selectUsersResult = userApiSlice.endpoints.getUsers.select()
//creates memoized selector
const selectUsersData = createSelector(
    selectUsersResult,
    usersResult=> usersResult.data
)
//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
 selectAll:selectAllUsers,
 selectById:selectUserById,
 selectIds:selectUserIds
} = usersAdapters.getSelectors(state=>selectUsersData(state) ?? initialState)