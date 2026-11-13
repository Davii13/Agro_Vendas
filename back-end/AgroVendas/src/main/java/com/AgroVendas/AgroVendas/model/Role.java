package com.AgroVendas.AgroVendas.model;

public enum Role {
    /** Manages user accounts in addition to everything an operator can do. */
    ADMIN,
    /** Records sales, deliveries, customers and products. Cannot manage accounts. */
    OPERADOR
}
