const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'customer_id'
    },
    driverId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'driver_id'
    },
    transportType: {
        type: DataTypes.ENUM('MOTORBIKE', 'CAR'),
        allowNull: false,
        field: 'transport_type'
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'price'
    },
    status: {
        type: DataTypes.ENUM('ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED'),
        defaultValue: 'ASSIGNED',
        field: 'status'
    },
    cancelledBy: {
        type: DataTypes.ENUM('CUSTOMER', 'DRIVER'),
        field: 'cancelled_by'
    },
}, {
    tableName: 'order',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Order;