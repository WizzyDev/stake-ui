import type { AccountData } from '@solana-nft-programs/common'
import type { RewardDistributorData } from '@solana-nft-programs/staking/dist/cjs/programs/rewardDistributor'
import type { StakePoolData } from '@solana-nft-programs/staking/dist/cjs/programs/stakePool'
import type { Mint } from '@solana/spl-token'
import { getMint } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { notify } from 'common/Notification'
import { useFormik } from 'formik'
import { useHandleCreationForm } from 'handlers/useHandleCreationForm'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useEffect, useMemo, useState } from 'react'

import { MasterPanel } from '@/components/stake-pool-creation/master-panel/MasterPanel'
import type { CreationForm } from '@/components/stake-pool-creation/Schema'
import { creationFormSchema } from '@/components/stake-pool-creation/Schema'
import {
  SlavePanel,
  SlavePanelScreens,
} from '@/components/stake-pool-creation/SlavePanel'
import { SuccessPanel } from '@/components/stake-pool-creation/SuccessPanel'

const {
  INTRO,
  AUTHORIZATION_1,
  REWARD_DISTRIBUTION_2,
  TIME_BASED_PARAMETERS_1,
} = SlavePanelScreens

export type StakePoolCreationFlowProps = {
  stakePoolData?: AccountData<StakePoolData>
  rewardDistributorData?: AccountData<RewardDistributorData>
  type?: 'update' | 'create'
}

const initialSlaveScreenPerStep = [
  INTRO,
  AUTHORIZATION_1,
  REWARD_DISTRIBUTION_2,
  TIME_BASED_PARAMETERS_1,
]

export const StakePoolCreationFlow = ({
  type = 'create',
  stakePoolData,
  rewardDistributorData,
}: StakePoolCreationFlowProps) => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const handleCreationForm = useHandleCreationForm()

  const [currentStep, setCurrentStep] = useState(0)
  const [activeSlavePanelScreen, setActiveSlavePanelScreen] =
    useState<SlavePanelScreens>(INTRO)
  const [stakePoolId, setStakePoolId] = useState<PublicKey>()

  const initialValues: CreationForm = {
    requireCollections: (stakePoolData?.parsed.requiresCollections ?? []).map(
      (pk) => pk.toString()
    ),
    requireCreators: (stakePoolData?.parsed.requiresCreators ?? []).map((pk) =>
      pk.toString()
    ),
    requiresAuthorization: stakePoolData?.parsed.requiresAuthorization ?? false,
    resetOnStake: stakePoolData?.parsed.resetOnStake ?? false,
    cooldownPeriodSeconds: stakePoolData?.parsed.cooldownSeconds ?? undefined,
    minStakeSeconds: stakePoolData?.parsed.minStakeSeconds ?? undefined,
    endDate: stakePoolData?.parsed.endDate
      ? new Date(stakePoolData?.parsed.endDate.toNumber() * 1000)
          .toISOString()
          .split('T')[0]
      : undefined,
    rewardMintAddress: rewardDistributorData?.parsed.rewardMint
      ? rewardDistributorData?.parsed.rewardMint.toString()
      : undefined,
    rewardAmount: rewardDistributorData?.parsed.rewardAmount
      ? rewardDistributorData?.parsed.rewardAmount.toString()
      : undefined,
    rewardDurationSeconds: rewardDistributorData?.parsed.rewardDurationSeconds
      ? rewardDistributorData?.parsed.rewardDurationSeconds.toString()
      : undefined,
    rewardMintSupply: rewardDistributorData?.parsed.maxSupply
      ? rewardDistributorData?.parsed.maxSupply.toString()
      : undefined,
    maxRewardSecondsReceived: rewardDistributorData?.parsed
      .maxRewardSecondsReceived
      ? rewardDistributorData?.parsed.maxRewardSecondsReceived.toString()
      : undefined,
    multiplierDecimals: rewardDistributorData?.parsed.multiplierDecimals
      ? rewardDistributorData?.parsed.multiplierDecimals.toString()
      : undefined,
    defaultMultiplier: rewardDistributorData?.parsed.defaultMultiplier
      ? rewardDistributorData?.parsed.defaultMultiplier.toString()
      : undefined,
  }

  const formState = useFormik({
    initialValues,
    onSubmit: () => {},
    validationSchema: creationFormSchema,
  })
  const { values, setFieldValue } = formState

  const [submitDisabled, setSubmitDisabled] = useState<boolean>(false)
  const [_processingMintAddress, setProcessingMintAddress] =
    useState<boolean>(false)
  const [mintInfo, setMintInfo] = useState<Mint>()

  useMemo(async () => {
    if (!values.rewardMintAddress) {
      setMintInfo(undefined)
      return
    }
    if (values.rewardMintAddress) {
      setSubmitDisabled(true)
      setProcessingMintAddress(true)
      try {
        const mint = new PublicKey(values.rewardMintAddress)
        const mintInfo = await getMint(connection, mint)
        setMintInfo(mintInfo)
        setFieldValue('rewardAmount', 0)
        if (
          type === 'update' &&
          values.rewardMintAddress?.toString() ===
            rewardDistributorData?.parsed.rewardMint.toString()
        ) {
          return
        }

        setSubmitDisabled(false)
        setProcessingMintAddress(false)
        notify({ message: `Valid reward mint address`, type: 'success' })
      } catch (e) {
        setMintInfo(undefined)
        setSubmitDisabled(true)
        if (values.rewardMintAddress.length > 0) {
          console.log(e)
          notify({
            message: `Invalid reward mint address: ${e}`,
            type: 'error',
          })
        }
      } finally {
        setProcessingMintAddress(false)
      }
    }
  }, [values.rewardMintAddress?.toString()])

  const autoSelectFirstSlaveScreen = () => {
    if (!initialSlaveScreenPerStep[currentStep]) return
    setActiveSlavePanelScreen(initialSlaveScreenPerStep[currentStep] || INTRO)
  }

  useEffect(() => {
    autoSelectFirstSlaveScreen()
  }, [currentStep])

  if (handleCreationForm.isSuccess) {
    return <SuccessPanel stakePoolId={stakePoolId} />
  }

  return (
    <div className="flex h-[85vh] min-h-[550px] py-8">
      <MasterPanel
        activeSlavePanelScreen={activeSlavePanelScreen}
        type={type}
        submitDisabled={submitDisabled}
        mintInfo={mintInfo}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        setActiveSlavePanelScreen={setActiveSlavePanelScreen}
        formState={formState}
        handleSubmit={() =>
          handleCreationForm.mutate(
            {
              values: formState.values,
              mintInfo: mintInfo,
            },
            {
              onSuccess: ([, publicKey]) => setStakePoolId(publicKey),
            }
          )
        }
        isLoading={handleCreationForm.isLoading}
      />
      <SlavePanel activeScreen={activeSlavePanelScreen} />
    </div>
  )
}
