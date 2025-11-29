'use client';

// message [string]: the content of the message
// error [boolean]: whether it is an error or success message 
export default function FeedBackMessage({message, error}) {
    return <p className={`${message === undefined || message === '' ? 'hidden' : 'message'} 
    ${error ? "error" : "success"}`}>{message}</p>
}