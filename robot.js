// ==========================================
// 1. MẠNG LƯỚI ĐƯỜNG ĐI & ĐỒ THỊ (GRAPH)
// ==========================================
const roads = [
    "Alice's House-Bob's House", "Alice's House-Cabin",
    "Alice's House-Post Office", "Bob's House-Town Hall",
    "Daria's House-Ernie's House", "Daria's House-Town Hall",
    "Ernie's House-Grete's House", "Grete's House-Farm",
    "Grete's House-Shop", "Marketplace-Farm",
    "Marketplace-Post Office", "Marketplace-Shop",
    "Marketplace-Town Hall", "Shop-Town Hall"
];

function buildGraph(edges) {
    let graph = Object.create(null);
    function addEdge(from, to) {
        if (graph[from] == null) {
            graph[from] = [to];
        } else {
            graph[from].push(to);
        }
    }
    for (let [from, to] of edges.map(r => r.split("-"))) {
        addEdge(from, to);
        addEdge(to, from);
    }
    return graph;
}

const roadGraph = buildGraph(roads);

// ==========================================
// 2. TRẠNG THÁI LÀNG (VILLAGE STATE)
// ==========================================
class VillageState {
    constructor(place, parcels) {
        this.place = place;
        this.parcels = parcels;
    }

    move(destination) {
        if (!roadGraph[this.place].includes(destination)) {
            return this;
        }
        let parcels = this.parcels.map(p => {
            if (p.place != this.place) return p;
            return { place: destination, address: p.address };
        }).filter(p => p.place != p.address);
        return new VillageState(destination, parcels);
    }

    static random(parcelCount = 5) {
        let parcels = [];
        for (let i = 0; i < parcelCount; i++) {
            let address = randomPick(Object.keys(roadGraph));
            let place;
            do {
                place = randomPick(Object.keys(roadGraph));
            } while (place == address);
            parcels.push({ place, address });
        }
        return new VillageState("Post Office", parcels);
    }
}

function randomPick(array) {
    let choice = Math.floor(Math.random() * array.length);
    return array[choice];
}

// ==========================================
// 3. THUẬT TOÁN TÌM ĐƯỜNG (BFS)
// ==========================================
function findRoute(graph, from, to) {
    let work = [{ at: from, route: [] }];
    let visited = [];
    for (let i = 0; i < work.length; i++) {
        let { at, route } = work[i];
        for (let next of graph[at]) {
            if (next == to) return route.concat(next);
            if (!visited.includes(next)) {
                visited.push(next);
                work.push({ at: next, route: route.concat(next) });
            }
        }
    }
}

// ==========================================
// 4. BỔ SUNG CÁC CON ROBOT CŨ & EFFICIENT ROBOT
// ==========================================

// --- Robot Cũ 1: Ngẫu nhiên ---
function randomRobot(state) {
    return { direction: randomPick(roadGraph[state.place]) };
}

// --- Robot Cũ 2: Theo lộ trình cố định ---
const mailRoute = [
    "Alice's House", "Cabin", "Alice's House", "Bob's House",
    "Town Hall", "Daria's House", "Ernie's House",
    "Grete's House", "Shop", "Grete's House", "Farm",
    "Marketplace", "Post Office"
];

function routeRobot(state, memory) {
    if (memory.length == 0) {
        memory = mailRoute;
    }
    return { direction: memory[0], memory: memory.slice(1) };
}

// --- Robot Cũ 3: Có mục tiêu (BFS từng kiện) ---
function goalOrientedRobot({ place, parcels }, route) {
    if (route.length == 0) {
        let parcel = parcels[0];
        if (parcel.place != place) {
            route = findRoute(roadGraph, place, parcel.place);
        } else {
            route = findRoute(roadGraph, place, parcel.address);
        }
    }
    return { direction: route[0], memory: route.slice(1) };
}

// --- Robot Cải tiến: efficientRobot ---
function efficientRobot({ place, parcels }, route) {
    if (route.length == 0) {
        let routes = parcels.map(parcel => {
            if (parcel.place != place) {
                return {
                    route: findRoute(roadGraph, place, parcel.place),
                    pickUp: false // Đang đi nhặt
                };
            } else {
                return {
                    route: findRoute(roadGraph, place, parcel.address),
                    pickUp: true // Đang cầm trên tay đi giao
                };
            }
        });

        // Điểm thưởng: trừ 0.5 chi phí cho các mục tiêu đi giao hàng
        function score({ route, pickUp }) {
            return route.length - (pickUp ? 0.5 : 0);
        }

        route = routes.reduce((a, b) => score(a) < score(b) ? a : b).route;
    }

    return { direction: route[0], memory: route.slice(1) };
}

// ==========================================
// 5. HÀM ĐẾM SỐ BƯỚC ĐỂ SO SÁNH
// ==========================================
function countSteps(state, robot, memory = []) {
    for (let turn = 0; ; turn++) {
        if (state.parcels.length == 0) return turn;
        let action = robot(state, memory);
        state = state.move(action.direction);
        memory = action.memory;
    }
}

// ==========================================
// 6. HÀM SO SÁNH 2 ROBOT TRONG 100 LẦN
// ==========================================
function compareRobots(robot1, robot2, taskCount = 100) {
    let total1 = 0, total2 = 0;

    for (let i = 0; i < taskCount; i++) {
        // Cùng một trạng thái xuất phát cho cả 2 robot để đảm bảo công bằng
        let state = VillageState.random();
        total1 += countSteps(state, robot1.fn);
        total2 += countSteps(state, robot2.fn);
    }

    console.log(`=======================================================`);
    console.log(`📊 SO SÁNH HIỆU SUẤT TRONG ${taskCount} LẦN CHẠY`);
    console.log(`=======================================================`);
    console.log(`🤖 ${robot1.name.padEnd(20)}: TRUNG BÌNH ${(total1 / taskCount).toFixed(2)} BƯỚC / LẦN`);
    console.log(`🤖 ${robot2.name.padEnd(20)}: TRUNG BÌNH ${(total2 / taskCount).toFixed(2)} BƯỚC / LẦN`);
    console.log(`-------------------------------------------------------`);

    let diff = ((total1 - total2) / total1 * 100).toFixed(1);
    if (total1 > total2) {
        console.log(`🏆 ${robot2.name} NHANH HƠN ${robot1.name} KHẢO NGHĨA ${diff}%! 🔥`);
    } else {
        console.log(`🏆 ${robot1.name} NHANH HƠN ${robot2.name}!`);
    }
    console.log(`=======================================================\n`);
}

// ==========================================
// 7. HÀM CHẠY ROBOT VÀ IN LOG CHI TIẾT (CODE GỐC CỦA BẠN)
// ==========================================
function runRobotVerbose(state, robot, memory = []) {
    let totalParcels = state.parcels.length;
    console.log(`======================================================================`);
    console.log(`🚀 BẮT ĐẦU HÀNH TRÌNH GIAO HÀNG (Tổng số bưu kiện: ${totalParcels})`);
    console.log(`📍 Vị trí xuất phát: ${state.place}`);
    console.log(`======================================================================\n`);

    for (let turn = 1; ; turn++) {
        if (state.parcels.length == 0) {
            console.log(`\n🎉 HOÀN THÀNH! Đã giao xong toàn bộ ${totalParcels} bưu kiện sau ${turn - 1} bước di chuyển.\n`);
            return turn - 1;
        }

        let action = robot(state, memory);
        let prevPlace = state.place;
        let oldParcels = state.parcels;

        // Di chuyển sang địa điểm mới
        state = state.move(action.direction);
        memory = action.memory;

        // 1. Kiểm tra hàng vừa nhặt thêm tại điểm mới
        let newlyPicked = oldParcels.filter(p => p.place == state.place);

        // 2. Kiểm tra hàng vừa giao thành công tại điểm mới
        let delivered = oldParcels.filter(p => p.place == prevPlace && p.address == state.place);

        // 3. Tính toán số liệu thống kê
        let inHandCount = state.parcels.filter(p => p.place == state.place).length;
        let remainingCount = state.parcels.length;

        // Tạo chuỗi ghi chú sự kiện (Nhặt/Giao)
        let events = [];
        if (newlyPicked.length > 0) {
            events.push(`📥 Nhặt +${newlyPicked.length} kiện`);
        }
        if (delivered.length > 0) {
            events.push(`✅ Giao thành công ${delivered.length} kiện tại [${state.place}]`);
        }
        let eventText = events.length > 0 ? ` | ⚡ ${events.join(", ")}` : "";

        console.log(
            `Bước ${turn.toString().padStart(2, ' ')}: [${prevPlace}] ➡️ [${state.place}]` +
            ` | 🎒 Đang cầm: ${inHandCount}` +
            ` | 📦 Còn lại: ${remainingCount}` +
            `${eventText}`
        );
    }
}

// ==========================================
// CHẠY THỬ SO SÁNH VÀ LOG CHI TIẾT
// ==========================================

// 1. So sánh 2 robot (goalOrientedRobot vs efficientRobot) trong 100 lần
compareRobots(
    { name: "goalOrientedRobot", fn: goalOrientedRobot },
    { name: "efficientRobot", fn: efficientRobot },
    100
);

// 2. In log chi tiết 1 lần chạy của efficientRobot
let initialState = VillageState.random(5);
runRobotVerbose(initialState, efficientRobot); 
