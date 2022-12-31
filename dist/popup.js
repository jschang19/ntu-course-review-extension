'use strict'

const getActiveTabUrl = () => {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		let activeTab = tabs[0];
		let activeTabUrl = activeTab.url;
		checkUrl(activeTabUrl);
	});
};

const checkUrl = (url) => {
	url = new URL(url);
	const hostname = url.hostname;
	const ser_no = url.searchParams.get('ser_no');
	const allow_hostnames = ['nol2.aca.ntu.edu.tw', 'nol.ntu.edu.tw'];

	if (allow_hostnames.includes(hostname) == false || ser_no == null) {
		removeSpinner();
		$('#heading').text('進入台大課程詳情頁面，就能看到所有評論囉！');
	}
	else if (ser_no == "" && allow_hostnames.includes(hostname)) {
		removeSpinner();
		$('#heading').text('無法查詢此課程的評價（ ex.領域課程 ）');
	}
	else {
		$('.results').append('<div class="spinner-area d-flex justify-content-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>');
		$('#heading').text('載入中...');
		getReviewData(ser_no);
	}
};

const removeSpinner = () => {
	$('.spinner-area').fadeOut('fast', function () {
		$(this).remove();
	});
}

const getReviewData = (id) => {
	const url = 'http://ntucourse-api.jcshawn.com/api/course/' + String(id);
	$.ajax({
		url: url,
		type: 'GET',
		dataType: 'json',
		error: function (res) {
			removeSpinner();
			$('#heading').fadeOut(function () {
				$(this).text('無法成功查詢 @@ 請重新打開，或稍後再試');
			}).fadeIn('fast');
		},
		success: function (res) {
			if (!res.success) {
				removeSpinner();
				$('#heading').fadeOut(function () {
					$(this).text('暫時找不到這門課的資料');
				}).fadeIn('fast');
			} else {
				let teacher = res.teacher;
				let class_name = res.class_name;
				let id = res.id;
				let ptt_reviews = res.reviews.ptt ? res.reviews.ptt : [];
				let dcard_reviews = res.reviews.dcard ? res.reviews.dcard : [];
				let ntu_rating_reviews = res.reviews.ntu_rating ? res.reviews.ntu_rating : [];

				removeSpinner();
				$('.nav-pills').fadeIn('fast');
				$('#heading')
					.fadeOut(function () {
						if(teacher == null){
							$(this).text(id +' / '+class_name);
						}
						else{
							$(this).text(id + ' / '+class_name + ' - ' + teacher);
						}
					})
					.fadeIn('fast');
				if (ptt_reviews.length != 0) {
					ptt_reviews.map((review) => {
						$('.results')
							.append(
								'<div class="col mb-3 ptt-result"><div class="card h-100 shadow-sm"><div class="card-body"><h5 class="card-title">' +
								review.title +
								'</h5><p class="card-text">' +
								review.snippet +
								'</p><a href="' +
								review.link +
								'" class="btn btn-light result-link">看內容</a></div></div><!--end!--></div>'
							)
							.hide()
							.fadeIn('fast');
					});
				} else {
					$('.results').append('<p class="text-center ptt-result">沒有 PTT 評價</p>');
					if (teacher != null) {
						$('.results').append('<div class="d-flex justify-content-center ptt-result"><a href="https://www.google.com/search?q=' + teacher + ' site:ptt.cc/bbs/NTUcourse" class="btn btn-light result-link ptt-result">看教授 PTT 評價</a></div>');
					}
				}

				if (dcard_reviews.length != 0) {
					dcard_reviews.map((review) => {
						$('.results').append(
							'<div class="col mb-3 dcard-result"><div class="card h-100 shadow-sm"><div class="card-body"><h5 class="card-title">' +
							review.title +
							'</h5><p class="card-text">' +
							review.snippet +
							'</p><a href="' +
							review.link +
							'" class="btn btn-light result-link">看內容</a></div></div><!--end!--></div>'
						);
					});
				} else {
					$('.results').append('<p class="text-center dcard-result">沒有 Dcard 評價</p>');
					if (teacher != null) {
						$('.results').append('<div class="d-flex justify-content-center ptt-result"><a href="https://www.dcard.tw/search?forum=ntu&query=' + teacher + '" class="btn btn-light result-link dcard-result">教授在 Dcard 的相關貼文</a></div>');
					}
				}

				if (ntu_rating_reviews.length != 0) {
					ntu_rating_reviews.map((review) => {
						$('.results').append(
							'<div class="col mb-3 ntu-rating-result"><div class="card h-100 shadow-sm"><div class="card-body"><h5 class="card-title">' +
							review.title +
							'</h5><p class="card-text">' +
							review.snippet +
							'</p><a href="' +
							review.link +
							'" class="btn btn-light result-link">看內容</a></div></div><!--end!--></div>'
						);
					});
				} else {
					$('.results').append('<p class="text-center ntu-rating-result">沒有 NTU Rating 評價</p><div class="d-flex justify-content-center ptt-result "></div>');
					if (teacher != null) {
						$('.results').append('<a href="https://rating.myntu.me/search/0?courseName=' + class_name + '&instructor=' + teacher + '&strictSchedule=false" class="btn btn-light result-link ntu-rating-result">搜尋 NTU Rating</a>');
					}
				}
				$('.ptt-result').addClass('showed');
				$('.dcard-result').hide();
				$('.ntu-rating-result').hide();
			}
		},
		timeout: 6000, // sets timeout to 6 seconds
	});
};

$('.nav-pills').hide();
getActiveTabUrl();

$('.nav-switch').on('click', function () {
	let id = $(this).data('id');
	$('.active').removeClass('active');
	$(this).addClass('active');
	$('.showed').fadeOut('fast', function () {
		$('.showed').removeClass('showed');
		$('.' + id + '-result')
			.addClass('showed')
			.fadeIn('fast');
	});
});

$('body').on('click', '.result-link', function () {
	chrome.tabs.create({ url: $(this).attr('href') });
	return false;
});

$('body').on('click', '.footer-link', function () {
	chrome.tabs.create({ url: $(this).attr('href') });
	return false;
});
