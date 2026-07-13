// // services/LeaveService.js
// const db = require('../models');
// const LeaveBalance = db.LeaveBalance;
// const LeaveType = db.LeaveType;

// /**
//  * utility: round to 1 decimal (returns Number)
//  */
// function round1(n) {
//   const v = Number(n) || 0;
//   return Math.round(v * 10) / 10;
// }

// /**
//  * Add the leave request's days to leave_balance for the year derived from start_date.
//  * If a matching LeaveBalance row exists (user_id, leave_type_id, year) it increments leave_taken,
//  * otherwise it creates a new LeaveBalance row.
//  *
//  * @param {Object|Model} leaveReq - Sequelize LeaveRequest instance (must include number_of_days, user_id, leave_type_id, start_date)
//  * @param {Object} [options] - { transaction }
//  * @returns {Promise<LeaveBalance>}
//  */
// async function addToLeaveBalance(leaveReq, options = {}) {
//   if (!leaveReq) throw new Error('leaveReq is required');

//   const sequelize = db.sequelize;
//   const externalTx = options.transaction;
//   let localTx = null;
//   const t = externalTx || (await sequelize.transaction());

//   try {
//     // compute year & delta
//     const startDate = new Date(leaveReq.start_date);
//     if (Number.isNaN(startDate.getTime())) throw new Error('Invalid start_date on leaveReq');
//     const year = startDate.getFullYear();
//     const delta = round1(parseFloat(leaveReq.number_of_days || 0));
//     if (delta <= 0) throw new Error('number_of_days must be > 0 to add to balance');

//     // lock leaveType to get current day_count
//     const leaveType = await LeaveType.findByPk(leaveReq.leave_type_id, { transaction: t, lock: t.LOCK.UPDATE });
//     if (!leaveType) throw new Error('Associated LeaveType not found');

//     const currentBalanceValue = round1(parseFloat(leaveType.day_count || 0));

//     // try find existing LeaveBalance row with lock
//     let lb = await LeaveBalance.findOne({
//       where: { user_id: leaveReq.user_id, leave_type_id: leaveReq.leave_type_id, year },
//       transaction: t,
//       lock: t.LOCK.UPDATE
//     });

//     if (!lb) {
//       // create new
//       lb = await LeaveBalance.create({
//         user_id: leaveReq.user_id,
//         leave_type_id: leaveReq.leave_type_id,
//         year,
//         leave_taken: delta,
//         leave_balance: currentBalanceValue
//       }, { transaction: t });
//     } else {
//       // increment leave_taken and refresh leave_balance
//       const prevTaken = round1(parseFloat(lb.leave_taken || 0));
//       const newTaken = round1(prevTaken + delta);
//       lb.leave_taken = newTaken;
//       lb.leave_balance = currentBalanceValue;
//       await lb.save({ transaction: t });
//     }

//     if (!externalTx) await t.commit();
//     return lb;
//   } catch (err) {
//     if (!externalTx && t) await t.rollback();
//     throw err;
//   }
// }

// /**
//  * Remove the leave request's days from leave_balance (used when an Approved request becomes Rejected/Cancelled/Pending).
//  * It subtracts the number_of_days from leave_taken (floors at 0) and updates leave_balance to current day_count.
//  *
//  * @param {Object|Model} leaveReq - Sequelize LeaveRequest instance
//  * @param {Object} [options] - { transaction }
//  */
// async function removeFromLeaveBalance(leaveReq, options = {}) {
//   if (!leaveReq) throw new Error('leaveReq is required');

//   const sequelize = db.sequelize;
//   const externalTx = options.transaction;
//   const t = externalTx || (await sequelize.transaction());

//   try {
//     const startDate = new Date(leaveReq.start_date);
//     if (Number.isNaN(startDate.getTime())) throw new Error('Invalid start_date on leaveReq');
//     const year = startDate.getFullYear();
//     const delta = round1(parseFloat(leaveReq.number_of_days || 0));
//     if (delta <= 0) {
//       if (!externalTx) await t.commit();
//       return null;
//     }

//     // lock leaveType
//     const leaveType = await LeaveType.findByPk(leaveReq.leave_type_id, { transaction: t, lock: t.LOCK.UPDATE });
//     const currentBalanceValue = leaveType ? round1(parseFloat(leaveType.day_count || 0)) : 0;

//     // find LeaveBalance
//     const lb = await LeaveBalance.findOne({
//       where: { user_id: leaveReq.user_id, leave_type_id: leaveReq.leave_type_id, year },
//       transaction: t,
//       lock: t.LOCK.UPDATE
//     });

//     if (!lb) {
//       // nothing to revert
//       if (!externalTx) await t.commit();
//       return null;
//     }

//     const prevTaken = round1(parseFloat(lb.leave_taken || 0));
//     const newTaken = Math.max(0, round1(prevTaken - delta));
//     lb.leave_taken = newTaken;
//     lb.leave_balance = currentBalanceValue;
//     await lb.save({ transaction: t });

//     if (!externalTx) await t.commit();
//     return lb;
//   } catch (err) {
//     if (!externalTx && t) await t.rollback();
//     throw err;
//   }
// }

// module.exports = {
//   addToLeaveBalance,
//   removeFromLeaveBalance
// };


// services/LeaveService.js
const db = require('../models');
const LeaveBalance = db.LeaveBalance;
const LeaveType = db.LeaveType;

/**
 * utility: round to 1 decimal (returns Number)
 */
function round1(n) {
  const v = Number(n) || 0;
  return Math.round(v * 10) / 10;
}

/**
 * Add the leave request's days to leave_balance for the year derived from start_date.
 * If a matching LeaveBalance row exists (user_id, leave_type_id, year) it increments leave_taken,
 * otherwise it creates a new LeaveBalance row.
 *
 * @param {Object|Model} leaveReq - Sequelize LeaveRequest instance (must include number_of_days, user_id, leave_type_id, start_date)
 * @param {Object} [options] - { transaction }
 * @returns {Promise<LeaveBalance|null>}
 */
async function addToLeaveBalance(leaveReq, options = {}) {
  if (!leaveReq) throw new Error('leaveReq is required');

  const sequelize = db.sequelize;
  const externalTx = options.transaction;
  let localTx = null;
  const t = externalTx || (await sequelize.transaction());

  try {
    // compute year & delta
    const startDate = new Date(leaveReq.start_date);
    if (Number.isNaN(startDate.getTime())) throw new Error('Invalid start_date on leaveReq');
    const year = startDate.getFullYear();
    const delta = round1(parseFloat(leaveReq.number_of_days || 0));
    if (delta <= 0) {
      if (!externalTx) await t.commit();
      return null;
    }

    // lock leaveType to get current day_count
    const leaveType = await LeaveType.findByPk(leaveReq.leave_type_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!leaveType) throw new Error('Associated LeaveType not found');

    const currentBalanceValue = round1(parseFloat(leaveType.day_count || 0));

    // try find existing LeaveBalance row with lock
    let lb = await LeaveBalance.findOne({
      where: { user_id: leaveReq.user_id, leave_type_id: leaveReq.leave_type_id, year },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!lb) {
      // create new
      lb = await LeaveBalance.create({
        user_id: leaveReq.user_id,
        leave_type_id: leaveReq.leave_type_id,
        year,
        leave_taken: delta,
        leave_balance: currentBalanceValue
      }, { transaction: t });
    } else {
      // increment leave_taken and refresh leave_balance
      const prevTaken = round1(parseFloat(lb.leave_taken || 0));
      const newTaken = round1(prevTaken + delta);
      lb.leave_taken = newTaken;
      lb.leave_balance = currentBalanceValue;
      await lb.save({ transaction: t });
    }

    if (!externalTx) await t.commit();
    return lb;
  } catch (err) {
    if (!externalTx && t) await t.rollback();
    throw err;
  }
}

/**
 * Remove the leave request's days from leave_balance (used when an Approved request becomes Rejected/Cancelled/Pending).
 * It subtracts the number_of_days from leave_taken (floors at 0) and updates leave_balance to current day_count.
 *
 * @param {Object|Model} leaveReq - Sequelize LeaveRequest instance
 * @param {Object} [options] - { transaction }
 */
async function removeFromLeaveBalance(leaveReq, options = {}) {
  if (!leaveReq) throw new Error('leaveReq is required');

  const sequelize = db.sequelize;
  const externalTx = options.transaction;
  const t = externalTx || (await sequelize.transaction());

  try {
    const startDate = new Date(leaveReq.start_date);
    if (Number.isNaN(startDate.getTime())) throw new Error('Invalid start_date on leaveReq');
    const year = startDate.getFullYear();
    const delta = round1(parseFloat(leaveReq.number_of_days || 0));
    if (delta <= 0) {
      if (!externalTx) await t.commit();
      return null;
    }

    // lock leaveType
    const leaveType = await LeaveType.findByPk(leaveReq.leave_type_id, { transaction: t, lock: t.LOCK.UPDATE });
    const currentBalanceValue = leaveType ? round1(parseFloat(leaveType.day_count || 0)) : 0;

    // find LeaveBalance
    const lb = await LeaveBalance.findOne({
      where: { user_id: leaveReq.user_id, leave_type_id: leaveReq.leave_type_id, year },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!lb) {
      // nothing to revert
      if (!externalTx) await t.commit();
      return null;
    }

    const prevTaken = round1(parseFloat(lb.leave_taken || 0));
    const newTaken = Math.max(0, round1(prevTaken - delta));
    lb.leave_taken = newTaken;
    lb.leave_balance = currentBalanceValue;
    await lb.save({ transaction: t });

    if (!externalTx) await t.commit();
    return lb;
  } catch (err) {
    if (!externalTx && t) await t.rollback();
    throw err;
  }
}

module.exports = {
  addToLeaveBalance,
  removeFromLeaveBalance
};
