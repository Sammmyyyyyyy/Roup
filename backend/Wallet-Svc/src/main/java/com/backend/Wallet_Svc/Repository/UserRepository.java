package com.backend.Wallet_Svc.Repository;

import com.backend.Wallet_Svc.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // 1. Reserve funds: Deducts from unreserved, adds to reserved
    @Modifying
    @Query("UPDATE User u SET u.unreservedBalance = u.unreservedBalance - :amount, u.reservedBalance = u.reservedBalance + :amount WHERE u.id = :userId AND u.unreservedBalance >= :amount")
    int reserveFunds(@Param("userId") String userId, @Param("amount") BigDecimal amount);

    // 2. Release funds: Deducts from reserved, adds to unreserved (e.g., when outbid)
    @Modifying
    @Query("UPDATE User u SET u.reservedBalance = u.reservedBalance - :amount, u.unreservedBalance = u.unreservedBalance + :amount WHERE u.id = :userId AND u.reservedBalance >= :amount")
    int releaseReservedFunds(@Param("userId") String userId, @Param("amount") BigDecimal amount);

    // 3. Deduct for Escrow: Removes from reserved and total balances
    @Modifying
    @Query("UPDATE User u SET u.reservedBalance = u.reservedBalance - :amount, u.totalBalance = u.totalBalance - :amount WHERE u.id = :userId AND u.reservedBalance >= :amount")
    int deductReservedForEscrow(@Param("userId") String userId, @Param("amount") BigDecimal amount);

    // 4. Add funds to Seller: Adds to unreserved and total balances
    @Modifying
    @Query("UPDATE User u SET u.unreservedBalance = u.unreservedBalance + :amount, u.totalBalance = u.totalBalance + :amount WHERE u.id = :userId")
    int creditSellerFunds(@Param("userId") String userId, @Param("amount") BigDecimal amount);

    @Modifying
    @Query("UPDATE User u SET u.unreservedBalance = u.unreservedBalance + :amount, u.totalBalance = u.totalBalance + :amount WHERE u.id = :userId")
    int rechargeWallet(@Param("userId") String userId, @Param("amount") BigDecimal amount);

    @Modifying
    @Query("UPDATE User u SET u.unreservedBalance = u.unreservedBalance - :amount, u.totalBalance = u.totalBalance - :amount WHERE u.id = :userId AND u.unreservedBalance >= :amount")
    int withdrawFromWallet(@Param("userId") String userId, @Param("amount") BigDecimal amount);
}