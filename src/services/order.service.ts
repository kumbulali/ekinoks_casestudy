import { UpdateResult } from "typeorm";
import { dataSource } from "../config/dataSource";
import { Order } from "../entities/order.entity";
import { Product } from "../entities/product.entity";
import { ProductToOrder } from "../entities/productToOrder.entity";
import { User } from "../entities/user.entity";

const orderRepository = dataSource.getRepository(Order);
const productToOrderRepository = dataSource.getRepository(ProductToOrder);

export async function createOrder(
  data: { user_id: number; items: { product_id: number; quantity: number }[] },
  callBack: Function
) {
  try {
    var order = Order.create();
    const userOfOrder = await User.findOneBy({
      id: data.user_id,
    }).then((user) => {
      if (user) {
        order.user = user;
      } else {
        return callBack(
          Error(`Unable to find user. UserID ${data.user_id} does not exist.`)
        );
      }
    });
    await order.save();
    data.items.forEach((item) => {
      Product.findOneBy({ id: item.product_id }).then((product) => {
        if (product) {
          if (product.quantity >= item.quantity) {
            const productToOrderInstance = new ProductToOrder();
            productToOrderInstance.order = order;
            productToOrderInstance.product = product;
            productToOrderInstance.quantity = item.quantity;
            product.quantity -= item.quantity;
            product.save();
            productToOrderInstance.save();
          } else {
            return callBack(Error(`Insufficient stock on ${product.name}.`));
          }
        } else {
          return callBack(
            Error(
              `Unable to find product. Product ID ${item.product_id} does not exist.`
            )
          );
        }
      });
    });
    const savedOrder = await dataSource.manager.save(order);
    return callBack(null, savedOrder);
  } catch (error) {
    console.log(error);
    return callBack(error);
  }
}

export async function getAllOrders(callBack: Function) {
  try {
    const orders = await Order.find();
    return callBack(null, orders);
  } catch (error) {
    console.log(error);
    return callBack(error);
  }
}

export async function getOrderById(order_id: number, callBack: Function) {
  try {
    const order = await Order.findOneBy({ id: order_id });
    return callBack(null, order);
  } catch (error) {
    console.log(error);
    return callBack(error);
  }
}

export async function getAllOrdersOfUserId(
  user_id: number,
  callBack: Function
) {
  try {
    const order = await Order.find({
      relations: {
        user: true,
        productToOrder: true,
      },
    });
    return callBack(null, order);
  } catch (error) {
    console.log(error);
    return callBack(error);
  }
}

export async function updateOrder(
  order_id: number,
  data: {
    user_id: number | undefined;
    products: Product[] | undefined;
  },
  callBack: Function
) {
  try {
    // const order: UpdateResult = await dataSource
    //   .createQueryBuilder()
    //   .update(Order)
    //   .set({
    //     id: data.user_id,
    //     products: data.products,
    //   })
    //   .where("order_id = :order_id", { order_id: order_id })
    //   .execute();
    // console.log(order);
    // if (order.affected == 1) {
    //   return callBack(null, "success");
    // }
    // return callBack(0, "failed");
  } catch (error) {
    console.log(error);
    return callBack(error);
  }
}

export async function deleteOrder(order_id: number, callBack: Function) {
  try {
    const result = await dataSource
      .createQueryBuilder()
      .delete()
      .from(Order)
      .where("order_id = :order_id", { order_id: order_id })
      .execute();
    if (result.affected == 0) {
      return callBack("error", "An error occured when deleting.");
    }
    return callBack(null, "Successfully deleted.");
    return callBack(null, result);
  } catch (error) {
    console.log(error);
    callBack(error);
  }
}
