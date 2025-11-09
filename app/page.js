"use client"

import { useState, useEffect } from "react"
import Web3 from "web3"
import { CONTRACT_ADDRESS, POSTER_ABI } from "../lib/contract"

export default function Home() {
    const [web3, setWeb3] = useState(null)
    const [account, setAccount] = useState("")
    const [tag, setTag] = useState("")
    const [message, setMessage] = useState("")
    const [posts, setPosts] = useState([])
    const [filter, setFilter] = useState("")

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Установи MetaMask!")
            return
        }
        const web3Instance = new Web3(window.ethereum)
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" })
            const accounts = await web3Instance.eth.getAccounts()
            setAccount(accounts[0])
            setWeb3(web3Instance)
        } catch (err) {
            console.error(err)
        }
    }

    const loadPosts = async () => {
        if (!web3) return
        const contract = new web3.eth.Contract(POSTER_ABI, CONTRACT_ADDRESS)
        try {
            const events = await contract.getPastEvents("Post", {
                fromBlock: 0,
                toBlock: "latest",
            })
            const parsed = events
                .map((e) => {
                    const action = e.returnValues.action
                    if (!action.startsWith("post|")) return null
                    const parts = action.split("|")
                    return {
                        sender: e.returnValues.sender,
                        tag: parts[1] || "",
                        message: parts[2] || "",
                    }
                })
                .filter(Boolean)
                .reverse()
            setPosts(parsed)
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        if (web3) loadPosts()
    }, [web3])

    const sendPost = async () => {
        if (!tag || !message) return
        const contract = new web3.eth.Contract(POSTER_ABI, CONTRACT_ADDRESS)
        const action = `post|${tag}|${message}`
        try {
            await contract.methods.post(action).send({ from: account })
            setTag("")
            setMessage("")
            loadPosts()
        } catch (err) {
            alert("Ошибка: " + err.message)
        }
    }

    const filteredPosts = filter
        ? posts.filter((p) => p.tag.toLowerCase() === filter.toLowerCase())
        : posts

    return (
        <>
            <head>
                <title>Poster dApp</title>
            </head>
            <main
                style={{
                    padding: "2rem",
                    maxWidth: "800px",
                    margin: "0 auto",
                    fontFamily: "Arial",
                }}
            >
                <h1 style={{ textAlign: "center" }}>Poster dApp</h1>

                {!account ? (
                    <div style={{ textAlign: "center", margin: "2rem" }}>
                        <button onClick={connectWallet} style={btn}>
                            Подключить MetaMask
                        </button>
                    </div>
                ) : (
                    <p style={{ textAlign: "center" }}>
                        Подключено: <code>{account}</code>
                    </p>
                )}

                {account && (
                    <>
                        <section style={section}>
                            <h2>Опубликовать</h2>
                            <input
                                placeholder="Тег"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                style={input}
                            />
                            <input
                                placeholder="Сообщение"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                style={input}
                            />
                            <button onClick={sendPost} style={btn}>
                                Отправить
                            </button>
                        </section>

                        <section style={section}>
                            <h2>Фильтр по тегу</h2>
                            <input
                                placeholder="введите тег"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={input}
                            />
                            <button
                                onClick={() => setFilter("")}
                                style={btnGray}
                            >
                                Сброс
                            </button>
                        </section>

                        <section style={section}>
                            <h2>Посты</h2>
                            {filteredPosts.length === 0 ? (
                                <p>Нет постов.</p>
                            ) : (
                                <table style={table}>
                                    <thead>
                                        <tr>
                                            <th style={th}>Отправитель</th>
                                            <th style={th}>Тег</th>
                                            <th style={th}>Сообщение</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPosts.map((p, i) => (
                                            <tr key={i}>
                                                <td style={td}>
                                                    {p.sender.slice(0, 8)}...
                                                </td>
                                                <td style={td}>{p.tag}</td>
                                                <td style={td}>{p.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </section>
                    </>
                )}
            </main>
        </>
    )
}

const section = { margin: "2rem 0" }
const input = {
    padding: "10px",
    margin: "5px",
    width: "100%",
    fontSize: "16px",
}
const btn = {
    padding: "10px 20px",
    background: "#0066cc",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
}
const btnGray = { ...btn, background: "#666" }
const table = { width: "100%", borderCollapse: "collapse" }
const th = {
    border: "1px solid #ccc",
    padding: "10px",
    background: "#f0f0f0",
    textAlign: "left",
}
const td = { border: "1px solid #ddd", padding: "8px" }
