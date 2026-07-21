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
// 4. ROBOT CẢI TIẾN (efficientRobot)
// ==========================================
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
// 5. HÀM CHẠY ROBOT VÀ IN LOG CHI TIẾT
// ==========================================
function runRobotVerbose(state, robot, memory = []) {
    let totalParcels = state.parcels.length;
    console.log(`======================================================================`);
    console.log(`🚀 BẮT ĐẦU HÀNH TRÌNH GIAO HÀNG (Tổng số bưu kiện: ${totalParcels})`);
    console.log(`📍 Vị trí xuất phát: ${state.place}`);
    console.log(`======================================================================\n`);

    for (let turn = 1; ; turn++) {
        if (state.parcels.length == 0) {
            console.log(`\n🎉 HOÀN THÀNH! Đã giao xong toàn bộ ${totalParcels} bưu kiện sau ${turn - 1} bước di chuyển.`);
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
        // (Bưu kiện bước trước đang cầm đi giao tới địa điểm này và giờ đã biến mất khỏi state.parcels)
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
// CHẠY THỬ NGHỆM
// ==========================================
let initialState = VillageState.random(5);
runRobotVerbose(initialState, efficientRobot);