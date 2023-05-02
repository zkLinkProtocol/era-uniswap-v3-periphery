import { constants } from 'ethers'
import { Wallet, Contract } from 'zksync-web3'
import completeFixture from './shared/completeFixture'
import { expect } from './shared/expect'
import { TestERC20, TestCallbackValidation } from '../typechain'
import { FeeAmount } from './shared/constants'
import { deployContract, getWallets } from "./shared/zkSyncUtils";

describe('CallbackValidation', () => {
  const [nonpairAddr, ...wallets] = getWallets()

  async function callbackValidationFixture([wallet]: Wallet[]): Promise<{
    callbackValidation: TestCallbackValidation
    tokens: [TestERC20, TestERC20]
    factory: Contract
  }> {
    const { factory } = await completeFixture([wallet])
    const tokens = (await Promise.all([
      deployContract(wallet, 'TestERC20', [constants.MaxUint256.div(2)]), // do not use maxu256 to avoid overflowing
      deployContract(wallet, 'TestERC20', [constants.MaxUint256.div(2)]),
    ])) as [TestERC20, TestERC20]
    const callbackValidation = (await deployContract(wallet, 'TestCallbackValidation')) as TestCallbackValidation

    return {
      tokens,
      callbackValidation,
      factory: factory as Contract,
    }
  }

  let callbackValidation: TestCallbackValidation
  let tokens: [TestERC20, TestERC20]
  let factory: Contract

  beforeEach('load fixture', async () => {
    ;({ callbackValidation, tokens, factory } = await callbackValidationFixture(wallets))
  })

  it('reverts when called from an address other than the associated UniswapV3Pool', async () => {
    expect(
        (callbackValidation as any)
        .connect(nonpairAddr)
        .verifyCallback(factory.address, tokens[0].address, tokens[1].address, FeeAmount.MEDIUM)
    ).to.be.reverted
  })
})
