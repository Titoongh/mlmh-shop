import React from 'react'

interface User {
    id: number
    name: string
}

const UsersPage = async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/users', {
        cache: 'no-store'
    })

    const users: User[] = await res.json()
  
    return (
        <>
            <h1>Users</h1>
            <h2>{new Date().toLocaleTimeString()}</h2>
            <table >
                <thead >
                    <tr>
                        <th className='text-center'>Id</th>
                        <th className='text-center'>Name</th>
                    </tr>
                </thead>
                <tbody className='border-2'>
                {users.map(u => (
                    <>
                    <tr>
                            <td className='border-2'>{u.id}</td>
                            <td className='border-2'>{u.name}</td>
                    </tr>
                    </>
                ))}
                </tbody>
            </table>
        </>
    )
}

export default UsersPage
