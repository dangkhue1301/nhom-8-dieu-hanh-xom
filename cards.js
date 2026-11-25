(function (root) {
  'use strict';

  var LESSON_CONTENT = {
    title: 'Điều hành xóm',
    subtitle: 'Nhóm 8 · Chương 5, tiết 21–22',
    introSentences: [
      'Thị trường giúp hộ dân, hợp tác xã và doanh nghiệp quyết định sản xuất, mua bán thông qua giá cả và nhu cầu.',
      'Bạn vào vai Nhà nước, cân nhắc phát triển kinh tế và công bằng xã hội.'
    ],
    fullConcept:
      'Thị trường giúp hộ dân, hợp tác xã và doanh nghiệp quyết định sản xuất, mua bán thông qua giá cả và nhu cầu. Ở Việt Nam, nền kinh tế vận hành theo các quy luật thị trường, có sự quản lý của Nhà nước pháp quyền xã hội chủ nghĩa dưới sự lãnh đạo của Đảng Cộng sản Việt Nam, hướng đến phát triển và công bằng xã hội.',
    inevitability: {
      title: 'Tính tất yếu khách quan ở Việt Nam',
      cardIds: [1, 2],
      points: [
        {
          heading: 'Phù hợp xu hướng phát triển khách quan',
          detail:
            'Tín hiệu giá cả và quan hệ cung – cầu giúp các hộ dân, hợp tác xã và doanh nghiệp điều chỉnh nhịp sản xuất, phân bổ nguồn lực linh hoạt hơn.'
        },
        {
          heading: 'Phát huy ưu thế của kinh tế thị trường',
          detail:
            'Cạnh tranh và đòi hỏi chuẩn chất lượng từ thị trường thúc đẩy xóm cải tiến giống, kỹ thuật sấy và nâng cao năng suất lao động.'
        },
        {
          heading: 'Phù hợp nguyện vọng phát triển và cải thiện đời sống của nhân dân',
          detail:
            'Mở rộng đầu ra, giữ sinh kế cho hộ nhỏ và bảo vệ sự đồng thuận cộng đồng nhằm nâng cao thu nhập và đời sống người dân.'
        }
      ]
    },
    characteristics: [
      {
        id: 'muc-tieu',
        order: 1,
        name: 'Mục tiêu phát triển',
        shortName: 'Mục tiêu',
        icon: 'assets/icon-muc-tieu.png',
        fallbackEmoji: '🌅',
        cardIds: [3],
        summary:
          'Phát triển lực lượng sản xuất, xây dựng cơ sở vật chất – kỹ thuật gắn với nâng cao đời sống nhân dân (“dân giàu, nước mạnh, dân chủ, công bằng, văn minh”).'
      },
      {
        id: 'so-huu',
        order: 2,
        name: 'Sở hữu và thành phần kinh tế',
        shortName: 'Sở hữu',
        icon: 'assets/icon-so-huu.png',
        fallbackEmoji: '🏡',
        cardIds: [4, 5],
        summary:
          'Nhiều hình thức sở hữu và nhiều thành phần kinh tế (nhà nước, tập thể/hợp tác xã, tư nhân) cùng tham gia, cạnh tranh lành mạnh và bổ trợ nhau.'
      },
      {
        id: 'quan-ly',
        order: 3,
        name: 'Quan hệ quản lý',
        shortName: 'Quản lý',
        icon: 'assets/icon-quan-ly.png',
        fallbackEmoji: '📜',
        cardIds: [6, 10],
        summary:
          'Nhà nước pháp quyền XHCN quản lý, điều tiết thị trường bằng pháp luật, minh bạch thông tin, thanh kiểm tra hợp đồng và chính sách thuế để giữ ổn định dịch vụ công.'
      },
      {
        id: 'phan-phoi',
        order: 4,
        name: 'Quan hệ phân phối',
        shortName: 'Phân phối',
        icon: 'assets/icon-phan-phoi.png',
        fallbackEmoji: '🌾',
        cardIds: [7, 8],
        summary:
          'Thực hiện nhiều hình thức phân phối: theo kết quả lao động, hiệu quả kinh tế (sản lượng và chất lượng) đồng thời phân phối qua phúc lợi, hỗ trợ xã hội cho hộ khó khăn.'
      },
      {
        id: 'gan-ket',
        order: 5,
        name: 'Gắn tăng trưởng với công bằng xã hội',
        shortName: 'Tăng trưởng & Công bằng',
        icon: 'assets/icon-gan-ket.png',
        fallbackEmoji: '⚖️',
        cardIds: [9],
        summary:
          'Kết hợp tăng trưởng kinh tế với tiến bộ và công bằng xã hội ngay trong từng bước và từng chính sách, không để hộ nhỏ bị đứng ngoài cơ hội phát triển.'
      }
    ],
    wrapUpCard7: {
      promptTitle: 'Chốt bài trong một phút (Thẻ 07)',
      questions: [
        'Ai chọn trợ giống cho hộ thiếu vốn? Ai chọn trợ giá một phần cho mọi hộ?',
        'Mời mỗi bên nêu một người được lợi và một đánh đổi.',
        'Mở lại 5 ô ở Tổng kết và gọi đúng tên 5 đặc trưng của kinh tế thị trường định hướng XHCN ở Việt Nam.'
      ]
    }
  };

  var METRICS = [
    {
      key: 'T',
      name: 'Tăng trưởng',
      icon: 'assets/icon-tang-truong.png',
      fallbackEmoji: '🌱',
      initial: 50,
      colorClass: 'metric-growth'
    },
    {
      key: 'C',
      name: 'Công bằng',
      icon: 'assets/icon-cong-bang.png',
      fallbackEmoji: '⚖️',
      initial: 50,
      colorClass: 'metric-fairness'
    },
    {
      key: 'N',
      name: 'Ngân sách',
      icon: 'assets/icon-ngan-sach.png',
      fallbackEmoji: '🏺',
      initial: 50,
      colorClass: 'metric-budget'
    },
    {
      key: 'D',
      name: 'Đồng thuận',
      icon: 'assets/icon-dong-thuan.png',
      fallbackEmoji: '🤝',
      initial: 50,
      colorClass: 'metric-consensus'
    }
  ];

  var CHARACTERS = {
    'di-sau': {
      id: 'di-sau',
      name: 'Dì Sáu',
      role: 'Thương lái & thu mua lúa xóm',
      portrait: 'assets/di-sau.png',
      portrait2x: 'assets/di-sau-2x.png'
    },
    'chu-tu': {
      id: 'chu-tu',
      name: 'Chú Tư',
      role: 'Ban chủ nhiệm hợp tác xã',
      portrait: 'assets/chu-tu.png',
      portrait2x: 'assets/chu-tu-2x.png'
    },
    'anh-nam': {
      id: 'anh-nam',
      name: 'Anh Năm',
      role: 'Tổ trưởng gặt & hạ tầng xóm',
      portrait: 'assets/anh-nam.png',
      portrait2x: 'assets/anh-nam-2x.png'
    },
    'anh-bay': {
      id: 'anh-bay',
      name: 'Anh Bảy',
      role: 'Kỹ thuật viên quy hoạch kho bãi',
      portrait: 'assets/anh-bay.png',
      portrait2x: 'assets/anh-bay-2x.png'
    },
    'co-ba': {
      id: 'co-ba',
      name: 'Cô Ba',
      role: 'Cán bộ phụ trách dân sinh',
      portrait: 'assets/co-ba.png',
      portrait2x: 'assets/co-ba-2x.png'
    }
  };

  var CARDS = [
    {
      id: 1,
      code: '01',
      characterId: 'di-sau',
      situation: 'Đơn gạo tăng rồi, bà con bán riêng hay gom chung một chuyến?',
      lessonTag: 'Tính tất yếu · tín hiệu thị trường',
      lessonGroup: 'tat-yeu',
      characteristicId: null,
      left: {
        label: 'Bán riêng theo giá thị trường',
        deltas: { T: 5, D: -2 },
        feedback: 'Hộ có lúa bán kịp giá cao, còn vài hộ ít hàng khó gom đủ chuyến.',
        explanation:
          'Người sản xuất phản ứng nhanh theo tín hiệu giá cả để tối ưu doanh thu ngay khi cầu tăng, nhưng hộ nhỏ lẻ dễ bất lợi về chi phí vận chuyển nếu thiếu liên kết.'
      },
      right: {
        label: 'Gom đơn qua hợp tác xã',
        deltas: { T: 2, D: 3 },
        feedback: 'Nhiều hộ cùng giao được hàng, nhưng mất thêm thời gian gom lúa.',
        explanation:
          'Vẫn bám theo tín hiệu đơn hàng thị trường nhưng tổ chức gom chung qua hợp tác xã giúp cả hộ nhỏ tiếp cận thị trường và giữ sự đồng thuận.'
      }
    },
    {
      id: 2,
      code: '02',
      characterId: 'chu-tu',
      situation: 'Khách mới muốn lúa đạt chuẩn, mà chỉnh giống và cách sấy đều tốn tiền.',
      lessonTag: 'Tính tất yếu · thích ứng nhu cầu',
      lessonGroup: 'tat-yeu',
      characteristicId: null,
      left: {
        label: 'Hỗ trợ đạt chuẩn',
        deltas: { T: 5, N: -4 },
        feedback: 'Xóm có thêm đầu ra nếu đạt chuẩn, ngân sách phải ứng tiền tập huấn.',
        explanation:
          'Đáp ứng nhu cầu khắt khe của người mua giúp phát huy ưu thế cạnh tranh của kinh tế thị trường, mở rộng đầu ra dài hạn dù đòi hỏi vốn ứng trước.'
      },
      right: {
        label: 'Giữ giống quen',
        deltas: { T: 2, N: -1 },
        feedback: 'Bà con giữ được chi phí thấp, đổi lại chủ yếu bán cho khách cũ.',
        explanation:
          'Giữ phương thức quen giúp giảm rủi ro chi phí trước mắt cho hộ dân, nhưng xóm chậm thích ứng trước thay đổi nhu cầu của thị trường mới.'
      }
    },
    {
      id: 3,
      code: '03',
      characterId: 'anh-nam',
      situation: 'Xóm có khoản đầu tư, mình ưu tiên bến hàng hay nước sạch cho các hộ chưa có?',
      lessonTag: 'Mục tiêu phát triển',
      lessonGroup: 'dac-trung',
      characteristicId: 'muc-tieu',
      left: {
        label: 'Nâng cấp bến hàng',
        deltas: { T: 5 },
        feedback: 'Ghe chở được nhiều lúa hơn, các hộ thiếu nước sạch vẫn phải chờ.',
        explanation:
          'Ưu tiên hạ tầng lưu thông giúp phát triển lực lượng sản xuất và tăng năng lực vận chuyển hàng hóa, nhưng nhu cầu thiết yếu về đời sống của một số hộ chưa được giải quyết ngay.'
      },
      right: {
        label: 'Làm đường nước sạch',
        deltas: { C: 4, D: 2 },
        feedback: 'Hộ chưa có nước sạch được phục vụ trước, phần nâng cấp bến để kỳ sau.',
        explanation:
          'Mục tiêu của KTTT định hướng XHCN không chỉ là tăng sản lượng mà còn trực tiếp nâng cao đời sống và điều kiện sinh hoạt của nhân dân.'
      }
    },
    {
      id: 4,
      code: '04',
      characterId: 'di-sau',
      situation: 'Tới vụ cần thêm chỗ bán lúa, xóm muốn mở điểm mua theo cách nào?',
      lessonTag: 'Sở hữu và thành phần kinh tế',
      lessonGroup: 'dac-trung',
      characteristicId: 'so-huu',
      left: {
        label: 'Mời doanh nghiệp tư nhân',
        deltas: { T: 5, D: -2 },
        feedback: 'Điểm mới gom được nhiều hàng, một số hộ lo điều kiện mua khó đáp ứng.',
        explanation:
          'Kinh tế tư nhân là một động lực quan trọng giúp mở rộng quy mô thu mua nhanh, song cần điều kiện giao dịch phù hợp để hộ nhỏ không bị gạt ra.'
      },
      right: {
        label: 'Giao hợp tác xã mở điểm mua',
        deltas: { T: 2, D: 4 },
        feedback: 'Hộ nhỏ có thể góp hàng chung, sức mua ban đầu còn hạn chế.',
        explanation:
          'Kinh tế tập thể (hợp tác xã) giúp các hộ nhỏ liên kết sức mạnh cùng tham gia thị trường, bù đắp bất lợi quy mô dù nguồn vốn khởi điểm khiêm tốn.'
      }
    },
    {
      id: 5,
      code: '05',
      characterId: 'anh-bay',
      situation: 'Vụ gặt sắp tới, xóm cần chỗ trữ lúa để bà con có thêm thời gian tìm người mua.',
      lessonTag: 'Sở hữu và thành phần kinh tế',
      lessonGroup: 'dac-trung',
      characteristicId: 'so-huu',
      left: {
        label: 'Nhà nước đầu tư kho chung',
        deltas: { N: -6, D: 4 },
        feedback: 'Hộ nhỏ có chỗ trữ ổn định sau khi kho hoàn thành, vốn đầu tư ban đầu cao.',
        explanation:
          'Sở hữu công và đầu tư của Nhà nước tạo hạ tầng dùng chung ổn định cho mọi hộ khi thị trường chưa tự cung ứng đủ cho người yếu thế, đổi lại áp lực ngân sách lớn.'
      },
      right: {
        label: 'Thuê chỗ trong kho tư nhân',
        deltas: { N: -2, D: 1 },
        feedback: 'Có chỗ trữ ngay với ít vốn hơn, số chỗ thuê có hạn.',
        explanation:
          'Nhà nước tận dụng hạ tầng có sẵn của thành phần kinh tế tư nhân giúp tiết kiệm ngân sách và triển khai nhanh, dù năng lực phục vụ còn giới hạn.'
      }
    },
    {
      id: 6,
      code: '06',
      characterId: 'co-ba',
      situation: 'Bà con phản ánh vài đại lý ép giá, mình ưu tiên kiểm tra gì trước?',
      lessonTag: 'Quan hệ quản lý',
      lessonGroup: 'dac-trung',
      characteristicId: 'quan-ly',
      left: {
        label: 'Yêu cầu công khai giá và điều kiện mua',
        deltas: { N: -2, D: 2 },
        feedback: 'Hộ dễ đối chiếu giá hơn, khiếu nại từng giao dịch vẫn cần xử lý.',
        explanation:
          'Nhà nước quản lý thông qua quy định minh bạch thông tin thị trường để người dân tự bảo vệ quyền lợi với chi phí hành chính vừa phải.'
      },
      right: {
        label: 'Rà soát hợp đồng bị phản ánh',
        deltas: { N: -5, D: 5 },
        feedback: 'Bà con có nơi gửi bằng chứng, xóm phải bố trí thêm người kiểm tra.',
        explanation:
          'Nhà nước pháp quyền XHCN trực tiếp thanh tra, bảo vệ quyền lợi hợp pháp và xử lý hành vi ép giá, đòi hỏi nguồn lực quản lý lớn hơn.'
      }
    },
    {
      id: 7,
      code: '07',
      characterId: 'co-ba',
      situation: 'Hộ thiếu vốn sắp trễ vụ vì chưa mua được giống.',
      lessonTag: 'Quan hệ phân phối · hỗ trợ xã hội',
      lessonGroup: 'dac-trung',
      characteristicId: 'phan-phoi',
      left: {
        label: 'Trợ giống cho hộ thiếu vốn',
        deltas: { C: 5, N: -4 },
        feedback: 'Hộ khó khăn nhận đủ hỗ trợ để xuống giống, ngân sách chi nhiều hơn.',
        explanation:
          'Phân phối qua phúc lợi và hỗ trợ xã hội tập trung đúng đối tượng dễ tổn thương giúp thu hẹp khoảng cách cơ hội vào vụ, dù cần khoản chi ngân sách đáng kể.'
      },
      right: {
        label: 'Trợ giá một phần cho mọi hộ',
        deltas: { C: 2, N: -2 },
        feedback: 'Nhiều hộ được giảm chút chi phí, hộ thiếu vốn nhất vẫn phải bù thêm.',
        explanation:
          'Hỗ trợ dàn trải giúp giảm nhẹ chi phí cho số đông và tiết kiệm ngân sách hơn, nhưng hiệu quả nâng đỡ nhóm thiếu vốn nhất lại hạn chế hơn.'
      }
    },
    {
      id: 8,
      code: '08',
      characterId: 'anh-nam',
      situation: 'Tổ gặt muốn thưởng người làm nhiều, nhưng cũng lo lúa lẫn tạp chất nếu chạy sản lượng.',
      lessonTag: 'Quan hệ phân phối · kết quả lao động',
      lessonGroup: 'dac-trung',
      characteristicId: 'phan-phoi',
      left: {
        label: 'Thưởng theo sản lượng',
        deltas: { T: 4, D: -2 },
        feedback: 'Tổ gặt có động lực làm nhanh, người làm khâu kiểm tra chất lượng ít được ghi nhận.',
        explanation:
          'Phân phối theo số lượng đầu ra khuyến khích tốc độ thu hoạch cao, nhưng dễ bỏ sót công sức của khâu đảm bảo chất lượng hạt lúa.'
      },
      right: {
        label: 'Thưởng theo sản lượng và chất lượng',
        deltas: { T: 1, D: 3 },
        feedback: 'Công giữ chất lượng được ghi nhận, tổ cần thêm thời gian kiểm tra.',
        explanation:
          'Phân phối theo kết quả lao động và hiệu quả kinh tế toàn diện vừa khuyến khích năng suất vừa ghi nhận đúng công giữ chuẩn chất lượng chung.'
      }
    },
    {
      id: 9,
      code: '09',
      characterId: 'chu-tu',
      situation: 'Vụ rồi sản lượng tăng, nhưng hộ nhỏ vẫn khó tiếp cận máy sấy.',
      lessonTag: 'Gắn tăng trưởng với công bằng xã hội',
      lessonGroup: 'dac-trung',
      characteristicId: 'gan-ket',
      left: {
        label: 'Ưu tiên đơn lớn để chạy đủ công suất',
        deltas: { T: 5, C: -2 },
        feedback: 'Xóm bán được nhiều lúa sấy hơn, hộ nhỏ vẫn khó đặt lượt.',
        explanation:
          'Chạy theo hiệu quả quy mô thuần túy giúp tăng tổng lượng hàng qua máy sấy nhưng khiến hộ nhỏ tiếp tục bị gạt ra, làm rộng khoảng cách giữa các nhóm hộ.'
      },
      right: {
        label: 'Dành một phần lượt sấy cho hộ nhỏ',
        deltas: { T: 2, C: 4 },
        feedback: 'Hộ nhỏ có chỗ sấy để giảm hao hụt, tốc độ nhận đơn lớn chậm hơn.',
        explanation:
          'Thể hiện rõ nét gắn tăng trưởng với công bằng xã hội ngay trong chính sách vận hành hạ tầng: chấp nhận chậm một phần đơn lớn để hộ nhỏ cùng giảm hao hụt.'
      }
    },
    {
      id: 10,
      code: '10',
      characterId: 'di-sau',
      situation: 'Bên mua cần thêm vốn ứng tiền lúa, xóm cũng cần tiền sửa bến và duy trì dịch vụ chung.',
      lessonTag: 'Quan hệ quản lý',
      lessonGroup: 'dac-trung',
      characteristicId: 'quan-ly',
      left: {
        label: 'Giảm thuế kỳ này',
        deltas: { T: 3, N: -4 },
        feedback: 'Bên thu mua có thêm vốn ứng tiền, nguồn thu cho dịch vụ giảm.',
        explanation:
          'Nhà nước sử dụng công cụ thuế để kích thích dòng vốn thu mua lúa cho nông dân vào cao điểm, đánh đổi bằng phần nguồn thu duy trì dịch vụ công.'
      },
      right: {
        label: 'Giữ mức thuế',
        deltas: { T: -2, N: 3 },
        feedback: 'Ngân sách có nguồn duy trì dịch vụ, bên thu mua mở rộng chậm hơn.',
        explanation:
          'Nhà nước giữ ổn định nguồn thu tài chính công để bảo đảm sửa chữa bến bãi và duy trì dịch vụ chung của xóm, dù tốc độ mở rộng thu mua chậm lại.'
      }
    }
  ];

  var GAME_DATA = {
    LESSON_CONTENT: LESSON_CONTENT,
    METRICS: METRICS,
    CHARACTERS: CHARACTERS,
    CARDS: CARDS
  };

  if (typeof window !== 'undefined') {
    window.GAME_DATA = GAME_DATA;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GAME_DATA;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
