
import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { sub } from 'date-fns';
import { apiSlice } from "../api/apiSlices";

//const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

const postsAdapter = createEntityAdapter({
    sortComparer: (a, b) => b.date.localeCompare(a.date)
})

const initialState = postsAdapter.getInitialState()

export const extendedApiSlice = apiSlice.injectEndpoints({
    endpoints:builder=>({
        getPosts: builder.query({
            query:()=>'/posts',
            transformResponse: responseData => {
                let min =1
                const loadPosts = responseData.map(post => {
                    if(!post?.date) post.date = sub(new Date(),{minutes:min++}).toISOString()
                    if(!post?.reactions) post.reactions ={
                        thumbsUp: 0,
                        wow: 0,
                        heart: 0,
                        rocket: 0,
                        coffee: 0
                    }
                    return post
                })
                return postsAdapter.setAll(initialState,loadPosts)
            },
            providesTags:(result,error,arg)=>[
                {type:'Post',id:"LIST"},
                ...result.ids.map(id=> ({type:'Post',id}))
            ]
        }),
        getPostsByUserId : builder.query({
            query:id=> `/posts/?userId=${id}`,
            transformResponse:responseData=>{
                let min=1
                const loadPosts = responseData.map(post=>{
                    if(!post?.date) post.date = sub(new Date(),{minutes:min++}).toISOString()
                    if (!post?.reactions) post.reactions = {
                        thumbsUp: 0,
                        wow: 0,
                        heart: 0,
                        rocket: 0,
                        coffee: 0
                    }
                    return post
                })
                return postsAdapter.setAll(initialState,loadPosts)
            },
            providesTags:(result,error,arg)=>[
                ...result.ids.map(id=>({type:'Post',id}))
            ]
        }),
        addNewPost: builder.mutation({
            query:initialPost =>({
                url:'/posts',
                method:'POST',
                body:{
                    ...initialPost,
                    userId:Number(initialPost.userId),
                    date:new Date().toISOString(),
                    reactions:{
                        thumbsUp: 0,
                        wow: 0,
                        heart: 0,
                        rocket: 0,
                        coffee: 0 
                    }
                }
            }),
            invalidatesTags:[
                {type:'Post',id:"LIST"}
            ]
        }),
        updatePost: builder.mutation({
            query: initialPost=>({
                url:`/posts/${initialPost.id}`,
                method:'PUT',
                body:{
                    ...initialPost,
                    date:new Date().toISOString()
                }
            }),
            invalidatesTags:(results,error,arg)=>[
                {type:'Post',id:arg.id}
            ]
        }),
        deletePost:builder.mutation({
            query: ({ id }) => ({
                url: `/posts/${id}`,
                method: 'DELETE',
                body: { id }
            }),
            invalidatesTags: (result, error, arg) => [
                { type: 'Post', id: arg.id }
            ]
        }),
        addReaction : builder.mutation({
            query:({postId,reactions})=>({
                url:`posts/${postId}`,
                method:'PATCH',
                body:{reactions}

            }),
            async onQueryStarted({postId,reactions},{dispatch,queryFulfilled}){
                const patchList  =dispatch(
                    extendedApiSlice.util.updateQueryData('getPosts',undefined,draft =>{
                        // The `draft` is Immer-wrapped and can be "mutated" like in createSlice
                    const post = draft.entities[postId]
                    if(post) post.reactions  =reactions
                    })
                )
                try {
                    await queryFulfilled
                } catch (error) {
                    patchList.undo()
                 }
            }
        })
    })
}) 
export const {
    useGetPostsQuery,
    useGetPostsByUserIdQuery,
    useAddNewPostMutation,
    useUpdatePostMutation,
    useDeletePostMutation,
    useAddReactionMutation
} = extendedApiSlice
//returns the query result object
export const selectPostsResult = extendedApiSlice.endpoints.getPosts.select()
//creates memozied selector
const selectPostsData = createSelector(
    selectPostsResult,
    postsResult => postsResult.data //normalized state object with ids & entities
)
//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
 selectAll:selectAllPosts,
 selectById: selectPostById,
 selectIds:selectPostIds
} = postsAdapter.getSelectors(state => selectPostsData(state) ?? initialState)