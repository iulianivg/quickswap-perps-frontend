import React, { useEffect, useMemo, useState } from "react";
import { useWeb3React } from "@web3-react/core";
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

function NewClaimAllButton(props) {
    const {
        isVisible,
        setIsVisible,
        rewardRouterAddress,
        library,
        chainId,
        setPendingTxns,
        wrappedTokenSymbol,
        nativeTokenSymbol,
        isClaim
    } = props;
    const [isClaiming, setIsClaiming] = useState(false);

    const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
        [chainId, "Stake-compound-should-convert-weth"],
        true
    );

    const [shouldAddIntoQLP, setShouldAddIntoQLP] = useLocalStorageSerializeKey(
        [chainId, "Stake-compound-should-add-into-qlp"],
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
                shouldAddIntoQLP,
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


    if (isClaim) {
        return (
            <button
                style={{ background: "#448AFF" }}
                className="Stake-card-option"
                // disabled={!active || !isClaimableAll(rewardTokens)}
                // onClick={() => setIsClaimAllModalVisible(true)}
            >
                Compound All
            </button>
        );
    } else {
        return (
            <button
                className="App-cta Exchange-swap-button query-modal"
                onClick={onClickPrimary}
                disabled={!isPrimaryEnabled()}
            >
                {getPrimaryText()}
            </button>
        )
    }
}

function ClaimAllModal(props) {
    const {
        isVisible,
        setIsVisible,
        rewardRouterAddress,
        library,
        chainId,
        setPendingTxns,
        wrappedTokenSymbol,
        nativeTokenSymbol,
    } = props;
    const [isClaiming, setIsClaiming] = useState(false);

    const [shouldConvertWeth, setShouldConvertWeth] = useLocalStorageSerializeKey(
        [chainId, "Stake-compound-should-convert-weth"],
        true
    );

    const [shouldAddIntoQLP, setShouldAddIntoQLP] = useLocalStorageSerializeKey(
        [chainId, "Stake-compound-should-add-into-qlp"],
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
                shouldAddIntoQLP,
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
                        <Checkbox isChecked={shouldConvertWeth} setIsChecked={setShouldConvertWeth} disabled={shouldAddIntoQLP}>
                            <span style={{ marginLeft: 5 }}>Convert {wrappedTokenSymbol} into {nativeTokenSymbol}</span>
                        </Checkbox>
                    </div>
                    <div>
                        <Checkbox isChecked={shouldAddIntoQLP} setIsChecked={setShouldAddIntoQLP}>
                            <span style={{ marginLeft: 5 }}>Compound {wrappedTokenSymbol} into QLP</span>
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
        claimToken,
        isClaiming,
        setIsClaiming,
        isClaim
    } = props;

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

export default function Stake({ setPendingTxns, connectWallet }) {
    const { active, library, account } = useWeb3React();
    const { chainId } = useChainId();

    const [isClaimAllModalVisible, setIsClaimAllModalVisible] = useState(false);
    const [isClaimModalVisible, setIsClaimModalVisible] = useState(false);
    const [claimToken, setClaimToken] = useState();
    const [isClaiming, setIsClaiming] = useState(false);

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

    const { infoTokens } = useInfoTokens(library, chainId, active, undefined, undefined);

    const quickPrice = useCoingeckoPrices("QUICK");

    const { data: claimableAll } = useSWR(
        [`Stake:stakingInfo:${active}`, chainId, feeQlpTrackerAddress, "claimableAll", account || PLACEHOLDER_ACCOUNT],
        {
            fetcher: fetcher(library, FeeQlpTracker, []),
        }
    );

    const rewardTokens = useMemo(() => {
        if (!Array.isArray(claimableAll) || claimableAll.length !== 2) return [];
        const [claimableTokens, claimableRewards] = claimableAll
        console.log(claimableTokens);
        console.log(claimableRewards);
        const result = [];
        for (let i = 0; i < claimableTokens.length; i++) {
            const reward = claimableRewards[i];
            if (claimableTokens[i] === getContract(chainId, "QUICK")) {
                result.push({ token: { address: claimableTokens[i], symbol: "QUICK" }, reward, rewardInUsd: quickPrice.mul(reward).div(expandDecimals(1, 18)) });
            } else {
                const token = infoTokens[claimableTokens[i]];
                if (token) {
                    result.push({ token, reward, rewardInUsd: token.maxPrice && token.maxPrice.mul(reward).div(expandDecimals(1, token.decimals)) });
                }
            }
        }
        return result;
    }, [claimableAll, chainId, quickPrice, infoTokens])

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
                isClaim={isClaim}
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
                isClaim={isClaim}
                library={library}
                chainId={chainId}
                claimToken={claimToken}
                isClaiming={isClaiming}
                setIsClaiming={setIsClaiming}
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
                        onClick={() => setIsClaimAllModalVisible(true)}
                    >
                        Claim All
                    </button>
                    {/* <button className="Stake-card-option" onClick={onClickPrimary} disabled={!isPrimaryEnabled()}>
                        {getPrimaryText()}
                    </button> */}
                    <button
                        style={{ background: "#448AFF" }}
                        className="Stake-card-option"
                        disabled={!active || !isClaimableAll(rewardTokens)}
                        onClick={() => setIsClaimAllModalVisible(true)}
                    >
                        Compound All
                    </button>
                </div>
                {rewardTokens && rewardTokens.map((rewardToken) => (
                    <>
                        <div className="Stake-card-title">
                            <div className="Stake-card-title-mark-label">
                                {formatAmount(rewardToken.reward, rewardToken.token.decimals, 4, true)}{'\u00A0'}
                                {rewardToken.token.symbol}{'\u00A0'}
                                ($
                                {formatAmount(rewardToken.rewardInUsd, USD_DECIMALS, 4, true)})
                            </div>
                        </div>
                        <div className="Stake-card-action">
                            <button
                                style={{ background: "#3E4252" }}
                                className="Stake-card-option"
                                disabled={!active || !isClaimable(rewardToken)}
                                onClick={() => {
                                    setIsClaim(true);
                                    setClaimToken(rewardToken);
                                    setIsClaimModalVisible(true);
                                }}
                            >
                                Claim
                            </button>
                            {rewardToken.token.symbol !== "QUICK" && (
                                <button
                                    style={{ background: "#3E4252" }}
                                    className="Stake-card-option"
                                    disabled={!active || !isClaimable(rewardToken)}
                                    onClick={() => {
                                        setClaimToken(rewardToken);
                                        setIsClaim(false);
                                        setIsClaimModalVisible(true);
                                    }}
                                >
                                    Compound
                                </button>
                            )}
                        </div>
                    </>
                ))}
            </div>
        </div>
    );
}