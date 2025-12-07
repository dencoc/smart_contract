"use client"

import { useEffect, useState } from "react"
import Web3 from "web3"
import { Copy, RefreshCw, Send, Wallet, Search } from "lucide-react"

const POSTER_ADDRESS = "0xf349F2101FEC5c2f7Bd48d46c5489C8991C3d3B9"

//import PosterArtifact from "../../artifacts/contracts/Poster.sol/Poster.json";

const POSTER_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "user",
                type: "address",
            },
            {
                indexed: false,
                internalType: "string",
                name: "content",
                type: "string",
            },
            {
                indexed: true,
                internalType: "string",
                name: "tag",
                type: "string",
            },
        ],
        name: "NewPost",
        type: "event",
    },
    {
        inputs: [
            {
                internalType: "string",
                name: "content",
                type: "string",
            },
            {
                internalType: "string",
                name: "tag",
                type: "string",
            },
        ],
        name: "post",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
]
export default function Home() {
    const [web3, setWeb3] = useState<any>(null)
    const [userAddress, setUserAddress] = useState<string | null>(null)
    const [contract, setContract] = useState<any>(null)
    const [content, setContent] = useState("")
    const [tag, setTag] = useState("")
    const [posts, setPosts] = useState<any[]>([])
    const [filterTag, setFilterTag] = useState("")
    const [loading, setLoading] = useState(false)
    const [posting, setPosting] = useState(false)

    // Подключение кошелька
    const handleConnect = async () => {
        if (!(window as any).ethereum) return alert("Установите MetaMask")

        const web3Instance = new Web3((window as any).ethereum)
        const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
        })
        const address = accounts[0]

        setUserAddress(address)
        setWeb3(web3Instance)
        const c = new web3Instance.eth.Contract(POSTER_ABI, POSTER_ADDRESS)
        setContract(c)
    }

    // Загрузка постов
    const loadPosts = async () => {
        if (!contract || !web3) return
        setLoading(true)
        try {
            const latest = Number(await web3.eth.getBlockNumber())
            const fromBlock = Math.max(0, latest - 25_000)

            const events = await contract.getPastEvents("NewPost", {
                fromBlock,
                toBlock: "latest",
            })

            const mapped = events.map((e: any) => ({
                user: e.returnValues.user,
                content: e.returnValues.content,
                tag: e.returnValues.tag,
            }))

            setPosts(mapped.reverse()) // новые сверху
        } catch (e: any) {
            console.error(e)
            alert("Ошибка загрузки постов: " + (e?.message ?? e))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (contract) loadPosts()
    }, [contract])

    // Отправка поста
    const handlePost = async () => {
        if (!contract || !userAddress || !content.trim() || !tag.trim()) {
            alert("Подключите кошелёк и заполните все поля")
            return
        }

        setPosting(true)
        try {
            const gas = await contract.methods
                .post(content, tag)
                .estimateGas({ from: userAddress })

            await contract.methods.post(content, tag).send({
                from: userAddress,
                gas,
            })

            setContent("")
            setTag("")
            await loadPosts()
        } catch (e: any) {
            alert("Ошибка транзакции: " + (e?.message ?? e))
        } finally {
            setPosting(false)
        }
    }

    const filteredPosts = posts.filter((p) =>
        filterTag ? p.tag.toLowerCase().includes(filterTag.toLowerCase()) : true
    )

    const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white">
            {/* Фоновые эффекты */}
            <div className="fixed inset-0 bg-[url('data:image/svg+xml,...')] opacity-20 pointer-events-none" />

            <div className="container mx-auto max-w-4xl px-4 py-12 relative z-10">
                {/* Хедер */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500">
                        Poster Chain
                    </h1>
                    <p className="mt-4 text-gray-300 text-lg">
                        Децентрализованные посты прямо в блокчейн
                    </p>
                </div>

                {/* Кнопка подключения */}
                {!userAddress ? (
                    <div className="flex justify-center">
                        <button
                            onClick={handleConnect}
                            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                            <Wallet className="w-6 h-6" />
                            Подключить MetaMask
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Подключённый адрес */}
                        <div className="flex justify-center mb-8">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                                <span className="font-mono">
                                    {shorten(userAddress)}
                                </span>
                                <button
                                    onClick={() =>
                                        navigator.clipboard.writeText(
                                            userAddress
                                        )
                                    }
                                    className="hover:text-pink-400 transition"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Форма создания поста */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-10 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Send className="w-7 h-7 text-pink-400" />
                                Новый пост
                            </h2>

                            <textarea
                                rows={4}
                                placeholder="Что у вас нового?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 placeholder-gray-400 focus:outline-none focus:border-pink-400 transition resize-none"
                            />

                            <div className="flex gap-4 mt-4">
                                <input
                                    placeholder="#тег"
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-5 py-4 placeholder-gray-400 focus:outline-none focus:border-pink-400 transition"
                                />

                                <button
                                    onClick={handlePost}
                                    disabled={posting}
                                    className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold hover:from-pink-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    {posting ? "Отправка..." : "Опубликовать"}
                                    {!posting && <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Фильтр + обновить */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    placeholder="Поиск по тегу..."
                                    value={filterTag}
                                    onChange={(e) =>
                                        setFilterTag(e.target.value)
                                    }
                                    className="w-full pl-12 pr-5 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:border-pink-400 transition"
                                />
                            </div>

                            <button
                                onClick={loadPosts}
                                disabled={loading}
                                className="flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-2xl hover:bg-white/20 transition"
                            >
                                <RefreshCw
                                    className={`w-5 h-5 ${
                                        loading ? "animate-spin" : ""
                                    }`}
                                />
                                Обновить
                            </button>
                        </div>

                        {/* Список постов */}
                        <div className="space-y-6">
                            {loading && filteredPosts.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="inline-block w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}

                            {!loading && filteredPosts.length === 0 && (
                                <div className="text-center py-20 text-gray-400 text-xl">
                                    Постов пока нет · Будьте первым!
                                </div>
                            )}

                            {filteredPosts.map((p, i) => (
                                <div
                                    key={i}
                                    className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-pink-500/30 transition-all duration-500 shadow-xl"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg">
                                                {p.user
                                                    .slice(2, 4)
                                                    .toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-mono text-sm opacity-80">
                                                    {shorten(p.user)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-pink-500/20 rounded-full text-pink-300 text-xs font-semibold">
                                            #{p.tag}
                                        </div>
                                    </div>

                                    <p className="text-lg leading-relaxed whitespace-pre-wrap">
                                        {p.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
