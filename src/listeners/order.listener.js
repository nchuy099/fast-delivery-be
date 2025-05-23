const redisClient = require('../config/redis');
const { sequelize } = require("../config/database");

const { matchDriver } = require('../services/driver.service');
const { Order, OrderLocation, OrderDetail, OrderSenderReceiver, OrderSpecialDemand, Driver, User } = require('../models/index');
const { where } = require('sequelize');
const { getSocket } = require('../services/websocket/driver');
const logger = require('../config/logger');
const { getPolyline, getInfoBasedOnRoadRoute } = require('../services/map.service');
module.exports = (io, socket) => {
    socket.on('order:create', async (data) => {
        logger.info('[OrderListener] order init', data.orderMain);
        const t = await sequelize.transaction();
        const customerId = socket.userId;

        try {
            const { orderMain, orderSenderReceiver, orderLocation, orderDetail, orderSpecialDemand } = data;
            const { pickupLat, pickupLng, dropoffLat, dropoffLng } = orderLocation;
            const { vehicleType } = orderMain;
            const { id: driverId } = await matchDriver(vehicleType, { pickupLat, pickupLng }, data);

            const { id: orderId } = await Order.create({ customerId, driverId, ...orderMain }, { transaction: t });

            await OrderSenderReceiver.create({ orderId, ...orderSenderReceiver }, { transaction: t });
            await OrderLocation.create({ orderId, ...orderLocation }, { transaction: t });
            await OrderDetail.create({ orderId, ...orderDetail }, { transaction: t });
            await OrderSpecialDemand.create({ orderId, ...orderSpecialDemand }, { transaction: t });

            await t.commit(); // Commit transaction nếu không có lỗi
            const driver = await Driver.findByPk(driverId);
            const user = await User.findByPk(driverId);

            const payloadCus = {
                success: true,
                message: 'Order created successfully',
                data: {
                    orderId,
                    driverInfo: {
                        id: driverId,
                        fullName: user.fullName,
                        phoneNumber: user.phoneNumber,
                        vehiclePlate: driver.vehiclePlate,
                    }
                }
            }

            const payloadDriver = {
                success: true,
                message: 'Order created successfully',
                data: {
                    orderId,
                }
            }


            socket.emit('order:create', payloadCus)
            const driverSocket = getSocket(driverId);
            driverSocket.emit('order:create', payloadDriver)
        } catch (error) {
            console.error(error);
            await t.rollback(); // rollback nếu có lỗi

            socket.emit('order:create', {
                success: false,
                message: 'Order create failed',
                error: error.message
            });
        }


    });

    socket.on('driver:location', async (data) => {
        const driverPos = await redisClient.geopos('drivers:locations', data.driverId);
        if (driverPos) {
            socket.emit('driver:location', {
                success: true,
                message: 'Driver location updated successfully',
                data: {
                    driverPos: {
                        lng: driverPos[0][0],
                        lat: driverPos[0][1]
                    }
                }
            });
        } else {
            socket.emit('driver:location', {
                success: false,
                message: 'Driver not found',
            });
        }
    });

    socket.on('order:cancel', async (data) => {
        try {
            const { orderId, cancelledBy } = data; // id and 'CUSTOMER' / 'DRIVER'

            const order = await Order.findByPk(orderId);

            await order.update({ status: "CANCELLED", cancelledBy });

            const payload = {
                success: true,
                message: `Order ${orderId} cancelled by ${cancelledBy} successfully`,
                data: {
                    orderId,
                    cancelledBy
                }
            }
            socket.emit('order:cancel', payload);

            if (cancelledBy == 'CUSTOMER') {

                const driverId = order.driverId;
                const driverSocket = await getSocket(driverId);
                driverSocket.emit('order:cancel', payload);

            } else {
                const customerId = order.customerId;
                const customerSocket = await getSocket(customerId);
                customerSocket.emit('order:cancel', payload);
            }
        } catch (error) {

            socket.emit('order:cancel', {
                success: false,
                message: 'Order cancel by customer failed',
                error: error.message
            });
        }
    });

}



