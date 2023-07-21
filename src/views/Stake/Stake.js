import React, { useEffect, useMemo, useState } from "react";
import Modal from "../../components/Modal/Modal";
import Checkbox from "../../components/Checkbox/Checkbox";
import Vault from "../../abis/Vault.json";
import Reader from "../../abis/Reader.json";
import RewardRouter from "../../abis/RewardRouter.json";
import RewardReader from "../../abis/RewardReader.json";
import FeeQlpTracker from "../../abis/FeeQlpTracker.json";
import QlpManager from "../../abis/QlpManager.json";
import { ethers } from "ethers";
import {

    fetcher,
    formatAmount,
    formatKeyAmount,
    useLocalStorageSerializeKey,
    useChainId,
    USD_DECIMALS,
    PLACEHOLDER_ACCOUNT,
    getBalanceAndSupplyData,
    getDepositBalanceData,
    getStakingData,
    getProcessedData,
    expandDecimals,

} from "../../Helpers";
import { callContract, useCoingeckoPrices, useInfoTokens } from "../../Api";
import { getConstant } from "../../Constants";
import useSWR from "swr";
import { getContract } from "../../Addresses";
import "./Stake.css";
import TooltipWithPortal from "../../components/Tooltip/TooltipWithPortal";
import Tooltip from "../../components/Tooltip/Tooltip";
import useWeb3Onboard from "../../hooks/useWeb3Onboard";


function ClaimAllModal(props) {
    const {
        isVisible,
        setIsVisible,
        rewardRouterAddress,
        library,
        chainId,
        setPendingTxns,
        wrappedTokenSymbol,
        nativeTokenSymbol
    } = props;
    const [isClaiming, setIsClaiming] = useState(false);

    const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
        [chainId, "Stake-compound-should-convert-weth"],
        true
    );


    const isPrimaryEnabled = () => {
        return !isClaiming;
    };

    const getPrimaryText = () => {

        if (isClaiming) {
            return "Claim All...";
        }
        return "Claim All";
    };

    const onClickPrimary = () => {

        setIsClaiming(true);

        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        callContract(
            chainId,
            contract,
            "handleRewards",
            [
                shouldConvertWeth,
                false
            ],
            {
                sentMsg: "Claim All submitted!",
                failMsg: "Claim All failed.",
                successMsg: "Claim All completed!",
                setPendingTxns,
            }
        )
            .then(async (res) => {
                setIsVisible(false);
            })
            .finally(() => {
                setIsClaiming(false);
            });
    };



    return (
        <div className="StakeModal">
            <Modal isVisible={isVisible} setIsVisible={setIsVisible} label="Claim All Rewards">
                <div className="CompoundModal-menu">
                    <div>
                        <Checkbox isChecked={shouldConvertWeth} setIsChecked={setShouldConvertWeth}>
                            <span style={{ marginLeft: 5 }}>Convert {wrappedTokenSymbol} into {nativeTokenSymbol}</span>
                        </Checkbox>
                    </div>
                </div>
                <div className="Exchange-swap-button-container">
                    <button
                        className="App-cta Exchange-swap-button query-modal"
                        onClick={onClickPrimary}
                        disabled={!isPrimaryEnabled()}
                    >
                        {getPrimaryText()}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

function ClaimModal(props) {
    const {
        isVisible,
        setIsVisible,
        rewardRouterAddress,
        library,
        chainId,
        setPendingTxns,
        nativeTokenSymbol,
        wrappedTokenSymbol,
        claimToken
    } = props;

    const [isClaiming, setIsClaiming] = useState(false);

    const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
        [chainId, "Stake-claim-should-convert-weth"],
        true
    );

    const isPrimaryEnabled = () => {
        return !isClaiming;
    };

    const getPrimaryText = () => {
        if (isClaiming) {
            return `Claiming...`;
        }
        return "Claim";
    };

    const onClickPrimary = () => {
        setIsClaiming(true);

        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        callContract(
            chainId,
            contract,
            "claim",
            [
                claimToken.token.address,
                shouldConvertWeth,
            ],
            {
                sentMsg: "Claim submitted.",
                failMsg: "Claim failed.",
                successMsg: "Claim completed!",
                setPendingTxns,
            }
        )
            .then(async (res) => {
                setIsVisible(false);
            })
            .finally(() => {
                setIsClaiming(false);
            });
    };



    return (
        <div className="StakeModal">
            <Modal isVisible={isVisible} setIsVisible={setIsVisible} label={`Claim ${claimToken ? claimToken.token.symbol : ""} Rewards`}>
                {claimToken && claimToken.token.symbol === wrappedTokenSymbol &&
                    (<div className="CompoundModal-menu">
                        <div>
                            <Checkbox isChecked={shouldConvertWeth} setIsChecked={setShouldConvertWeth}>
                                <span style={{ marginLeft: 12 }}>
                                    Convert {wrappedTokenSymbol} into {nativeTokenSymbol}
                                </span>
                            </Checkbox>
                        </div>
                    </div>)
                }
                <div className="Exchange-swap-button-container">
                    <button className="App-cta Exchange-swap-button query-modal" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
                        {getPrimaryText()}
                    </button>
                </div>
            </Modal>
        </div>
    );
}

export default function Stake({ setPendingTxns, connectWallet, rewardTokens }) {
    const { active, library, account } = useWeb3Onboard();
    const { chainId } = useChainId();

    const [isClaimAllModalVisible, setIsClaimAllModalVisible] = useState(false);
    const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);
    const [claimToken, setClaimToken] = useState();
    const [isClaiming, setIsClaiming] = useState(false);
    const [isCompoundAll, setIsCompoundAll] = useState(false);

    const [isClaim, setIsClaim] = useState();

    const rewardRouterAddress = getContract(chainId, "RewardRouter");
    const rewardReaderAddress = getContract(chainId, "RewardReader");
    const readerAddress = getContract(chainId, "Reader");

    const vaultAddress = getContract(chainId, "Vault");
    const nativeTokenAddress = getContract(chainId, "NATIVE_TOKEN");

    const qlpAddress = getContract(chainId, "QLP");

    const stakedQlpTrackerAddress = getContract(chainId, "StakedQlpTracker");
    const feeQlpTrackerAddress = getContract(chainId, "FeeQlpTracker");

    const qlpManagerAddress = getContract(chainId, "QlpManager");

    const nativeTokenSymbol = getConstant(chainId, "nativeTokenSymbol");
    const wrappedTokenSymbol = getConstant(chainId, "wrappedTokenSymbol");

    const walletTokens = [qlpAddress];
    const depositTokens = [
        qlpAddress,
    ];
    const rewardTrackersForDepositBalances = [
        feeQlpTrackerAddress,
    ];
    const rewardTrackersForStakingInfo = [
        stakedQlpTrackerAddress,
        feeQlpTrackerAddress,
    ];

    const { data: walletBalances } = useSWR(
        [
            `Stake:walletBalances:${active}`,
            chainId,
            readerAddress,
            "getTokenBalancesWithSupplies",
            account || PLACEHOLDER_ACCOUNT,
        ],
        {
            fetcher: fetcher(library, Reader, [walletTokens]),
        }
    );

    const { data: depositBalances } = useSWR(
        [
            `Stake:depositBalances:${active}`,
            chainId,
            rewardReaderAddress,
            "getDepositBalances",
            account || PLACEHOLDER_ACCOUNT,
        ],
        {
            fetcher: fetcher(library, RewardReader, [depositTokens, rewardTrackersForDepositBalances]),
        }
    );

    const { data: stakingInfo } = useSWR(
        [`Stake:stakingInfo:${active}`, chainId, rewardReaderAddress, "getStakingInfo", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, RewardReader, [rewardTrackersForStakingInfo]),
        }
    );



    let isClaimable = (rewardToken) => {
        return rewardToken && rewardToken.reward && rewardToken.reward.gt(0)
    };

    let isClaimableAll = (rewardTokens) => {
        return rewardTokens && Array.isArray(rewardTokens) && rewardTokens.some(r => r.reward && r.reward.gt(0));
    };

    const { data: aums } = useSWR([`Stake:getAums:${active}`, chainId, qlpManagerAddress, "getAums"], {
        fetcher: fetcher(library, QlpManager),
    });

    const { data: nativeTokenPrice } = useSWR(
        [`Stake:nativeTokenPrice:${active}`, chainId, vaultAddress, "getMinPrice", nativeTokenAddress],
        {
            fetcher: fetcher(library, Vault),
        }
    );


    let aum;
    if (aums && aums.length > 0) {
        aum = aums[0].add(aums[1]).div(2);
    }

    const { balanceData, supplyData } = getBalanceAndSupplyData(walletBalances);
    const depositBalanceData = getDepositBalanceData(depositBalances);
    const stakingData = getStakingData(stakingInfo);
    const processedData = getProcessedData(
        balanceData,
        supplyData,
        depositBalanceData,
        stakingData,
        aum,
        nativeTokenPrice,
    );

    const getClaimPrimaryText = (buttonToken) => {
        if (isClaiming && isClaim && buttonToken.token.symbol === claimToken.token.symbol) {
            return `Claiming...`;
        }
        return "Claim";
    };

    const getCompoundPrimaryText = (buttonToken) => {
        if (isClaiming && !isClaim && buttonToken.token.symbol === claimToken.token.symbol) {
            return `Compounding...`;
        }
        return "Compound";
    };

    const claim = (claimTokenAddress, shouldAddIntoQLP, shouldConvertWeth) => {
        setIsClaiming(true);
        const primaryName = shouldAddIntoQLP ? "Compound" : "Claim";
        console.log(claimToken);
        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        callContract(
            chainId,
            contract,
            "claim",
            [
                claimTokenAddress,
                shouldAddIntoQLP,
                shouldConvertWeth,
            ],
            {
                sentMsg: primaryName + " submitted.",
                failMsg: primaryName + " failed.",
                successMsg: primaryName + " completed!",
                setPendingTxns,
            }
        )
            .then(async (res) => {

            })
            .finally(() => {
                setIsClaiming(false);
            });
    };

    const compoundAll = () => {
        setIsCompoundAll(true);
        console.log(claimToken);
        const contract = new ethers.Contract(rewardRouterAddress, RewardRouter.abi, library.getSigner());
        callContract(
            chainId,
            contract,
            "handleRewards",
            [
                false,
                true,
            ],
            {
                sentMsg: "Compound All submitted.",
                failMsg: "Compound All failed.",
                successMsg: "Compound All completed!",
                setPendingTxns,
            }
        )
            .then(async (res) => {

            })
            .finally(() => {
                setIsCompoundAll(false);
            });
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);


    return (
        <div>
            <ClaimAllModal
                setPendingTxns={setPendingTxns}
                isVisible={isClaimAllModalVisible}
                setIsVisible={setIsClaimAllModalVisible}
                rewardRouterAddress={rewardRouterAddress}
                wrappedTokenSymbol={wrappedTokenSymbol}
                nativeTokenSymbol={nativeTokenSymbol}
                library={library}
                chainId={chainId}
            />
            <ClaimModal
                active={active}
                account={account}
                setPendingTxns={setPendingTxns}
                isVisible={isClaimModalVisible}
                setIsVisible={setIsClaimModalVisible}
                rewardRouterAddress={rewardRouterAddress}
                totalVesterRewards={processedData.totalVesterRewards}
                wrappedTokenSymbol={wrappedTokenSymbol}
                nativeTokenSymbol={nativeTokenSymbol}
                library={library}
                chainId={chainId}
                claimToken={claimToken}
            />
            <div className="Stake-cards">
                <div className="Stake-card-title">
                    <div className="Stake-card-title-mark">Earned</div>
                </div>

                <div className="Stake-card-action">
                    <button
                        style={{ background: "#448AFF" }}
                        className="Stake-card-option"
                        disabled={!active || !isClaimableAll(rewardTokens)}
                        onClick={() => {
                            setIsClaim(true);
                            setIsClaimAllModalVisible(true)
                        }}
                    >
                        Claim All
                    </button>
                    {/* <button className="Stake-card-option" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
                        {getPrimaryText()}
                    </button> */}
                    {/* <button
                        title="In case the reward token is in the pool, it will be added to the QLP"
                        style={{ background: "#448AFF" }}
                        className="Stake-card-option"
                        disabled={!active || !isClaimableAll(rewardTokens)}
                        onClick={() => {
                            setIsClaim(false);
                            compoundAll()
                        }}
                    >
                        {isCompoundAll ? "Compounding..." : "Compound All"}
                    </button> */}

                    <Tooltip
                        handle={
                            <button
                                style={{ background: "#448AFF" }}
                                className="Stake-card-option"
                                disabled={!active || !isClaimableAll(rewardTokens)}
                                onClick={() => {
                                    setIsClaim(false);
                                    compoundAll()
                                }}
                            >
                                {isCompoundAll ? "Compounding..." : "Compound All"}
                            </button>
                        }
                        renderContent= {()=> "In case the reward token is in the pool, it will be added to the QLP"}
                        position="right-bottom"
                    >

                    </Tooltip>
                </div>
                {rewardTokens && rewardTokens.map((rewardToken) => (
                    <>
                        <div className="Stake-card-title">
                            <div className="Stake-card-title-mark-label">
                                {formatAmount(rewardToken.reward, rewardToken.token.decimals, rewardToken.token.displayDecimals, true)}{'\u00A0'}
                                {rewardToken.token.symbol}{'\u00A0'}
                                ($
                                {formatAmount(rewardToken.rewardInUsd, USD_DECIMALS, 2, true)})
                            </div>
                        </div>
                        <div className="Stake-card-action">
                            <button
                                style={{ background: "#3E4252" }}
                                className="Stake-card-option"
                                disabled={!active || !isClaimable(rewardToken)}
                                onClick={() => {
                                    setClaimToken(rewardToken);
                                    setIsClaim(true);
                                    if (rewardToken.token.symbol === wrappedTokenSymbol) {
                                        setIsClaimModalVisible(true);
                                    } else {
                                        claim(rewardToken.token.address, false, false)
                                    }
                                }}
                            >
                                {getClaimPrimaryText(rewardToken)}
                            </button>
                            {rewardToken.token.symbol !== "QUICK" && (
                                <button
                                    style={{ background: "#3E4252" }}
                                    className="Stake-card-option"
                                    disabled={!active || !isClaimable(rewardToken)}
                                    onClick={() => {
                                        setIsClaim(false)
                                        setClaimToken(rewardToken);
                                        claim(rewardToken.token.address, true, false)
                                    }}
                                >
                                    {getCompoundPrimaryText(rewardToken)}
                                </button>
                            )}
                        </div>
                    </>
                ))}
            </div>
        </div>
    );
}