const dexFactoryAbi = require("./ABI/dexFactoryAbi")
const dexPairAbi = require("./ABI/dexPairAbi")
const tokenAbi = require("./ABI/tokenAbi")
const config = require("./config")
const Web3 = require('web3')
const fs = require('fs')

const app = async () => {
  const tokens = []
  const web3 = new Web3(config.web3Provider)
  const factoryContract = new web3.eth.Contract(dexFactoryAbi, config.dexFactoryAddress)
  const allPairsLength = await factoryContract.methods.allPairsLength().call()
  const wethTokenContract = new web3.eth.Contract(tokenAbi, config.WETH)

  for(let i = 0; i < allPairsLength; i++){
    try{
      const pairAddress = await factoryContract.methods.allPairs(i).call()
      const pairContract = new web3.eth.Contract(dexPairAbi, pairAddress)

      const token0 = String(await pairContract.methods.token0().call()).toLowerCase()
      const token1 = String(await pairContract.methods.token1().call()).toLowerCase()

      // Check if token WETH based
      if(token0 === config.WETH || token1 === config.WETH){
        const tokenAddress = token0 === config.WETH ? token1 : token0

        // Add only tokens with LD more than min
        const wethBalance = Number(await wethTokenContract.methods.balanceOf(pairAddress).call())
        if(wethBalance >= Number(config.minWETHLD)){
          const data = await fetchTokenData(tokenAddress, web3)
          console.log("Pushed ", data)
          tokens.push(data)
        }
      }
    }catch(e){
      console.log("err :", e)
    }
  }

  // store result
  const result = JSON.stringify(tokens)
  fs.writeFileSync('result.json', result)
}


// helper for fetch symbol and decimals
const fetchTokenData = async (address, web3) => {
  const tokenContract = new web3.eth.Contract(tokenAbi, address)
  const decimals = await tokenContract.methods.decimals().call()
  const symbol = await tokenContract.methods.symbol().call()

  return {
    address,
    decimals,
    symbol
  }
}

app()
